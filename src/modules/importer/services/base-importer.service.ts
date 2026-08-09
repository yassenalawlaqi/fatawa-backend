import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FatwaData, ImportResult, IImporter } from '../interfaces/i-importer.interface';
import { FatwaValidator } from '../utils/fatwa-validator.util';
import * as crypto from 'crypto';
import { KeywordExtractorService } from '../../search/keyword-extractor.service';

export abstract class BaseImporterService implements IImporter {
  abstract readonly sourceName: string;
  abstract readonly sourceSlug: string;
  abstract readonly officialUrl: string;

  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly keywordExtractor: KeywordExtractorService
  ) {}

  /**
   * Defines the strategy for fetching raw items (URLs, RSS items, JSON objects)
   * Uses an AsyncGenerator to allow stopping early when IMPORT_LIMIT is reached.
   */
  abstract fetchRawItems(startIndex: number): AsyncGenerator<any, void, unknown>;

  /**
   * Defines the strategy for extracting data from a raw item
   */
  abstract extractFatwaData(rawItem: any): Promise<FatwaData>;

  /**
   * Calculates the SHA-256 fingerprint for a Fatwa
   */
  protected calculateFingerprint(officialUrl: string, question: string, answer: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(`${officialUrl}||${question}||${answer}`);
    return hash.digest('hex');
  }

  /**
   * Execute the standardized import pipeline
   */
  async runImportPipeline(): Promise<ImportResult> {
    const startTime = Date.now();
    this.logger.log(`[START] Importing from ${this.sourceName}`);

    const metrics = {
      imported: 0,
      updated: 0,
      duplicated: 0,
      skipped: 0,
      failed: 0,
    };

    try {
      // Ensure source exists
      const source = await this.prisma.source.upsert({
        where: { slug: this.sourceSlug },
        update: {},
        create: {
          name: this.sourceName,
          slug: this.sourceSlug,
          type: 'official_website',
          officialUrl: this.officialUrl,
        },
      });

      // Checkpoint Recovery
      const checkpointKey = `import_checkpoint_${this.sourceSlug}`;
      let startIndex = 0;
      const checkpointMeta = await this.prisma.systemMetadata.findUnique({ where: { key: checkpointKey } });
      if (checkpointMeta && !isNaN(Number(checkpointMeta.value))) {
        startIndex = Number(checkpointMeta.value);
        this.logger.log(`Resuming ${this.sourceName} from checkpoint index: ${startIndex}`);
      }

      const importLimit = parseInt(process.env.IMPORT_LIMIT || '0', 10);
      if (importLimit > 0) {
        this.logger.log(`IMPORT_LIMIT is set to ${importLimit}. Processing up to ${importLimit} items from index ${startIndex}.`);
      } else {
        this.logger.log(`Processing all items from ${this.sourceName} starting from index ${startIndex}.`);
      }

      let processedCount = 0;
      const rawItemsGenerator = this.fetchRawItems(startIndex);

      for await (const item of rawItemsGenerator) {
        if (importLimit > 0 && processedCount >= importLimit) {
          this.logger.log(`Reached IMPORT_LIMIT of ${importLimit}. Stopping extraction early.`);
          break; // This breaks the loop and signals the generator to stop fetching new pages!
        }
        try {
          // Rate Limiting (Delay 500 - 1500ms)
          const delayMs = Math.floor(Math.random() * 1000) + 500;
          await new Promise(res => setTimeout(res, delayMs));

          // Retry Logic (up to 3 times)
          let extractedData: FatwaData | null = null;
          let retryCount = 0;
          let lastError = null;

          while (retryCount < 3) {
            try {
              extractedData = await this.extractFatwaData(item);
              break;
            } catch (err) {
              lastError = err;
              retryCount++;
              if (retryCount < 3) {
                this.logger.warn(`Retrying extractFatwaData for ${item.url} (Attempt ${retryCount}/3)...`);
                await new Promise(res => setTimeout(res, 2000));
              }
            }
          }

          if (!extractedData) {
            throw lastError || new Error(`Failed to extract data after 3 attempts`);
          }
          
          extractedData.sourceId = source.id;

          // Validate
          const validation = FatwaValidator.validate(extractedData);
          if (!validation.isValid) {
            this.logger.warn(`Skipping invalid fatwa ${extractedData.url}: ${validation.errors.join(', ')}`);
            metrics.skipped++;
            continue;
          }

          // Calculate fingerprint
          const newFingerprint = this.calculateFingerprint(
            extractedData.url || '',
            extractedData.question,
            extractedData.answer,
          );

          // Check existing by slug (URL-based identifier)
          const existingFatwa = await this.prisma.fatwa.findUnique({
            where: { slug: extractedData.slug },
          });

          if (existingFatwa) {
            if (existingFatwa.sourceFingerprint === newFingerprint) {
              // Exact duplicate, no changes
              metrics.duplicated++;
            } else {
              // Version Tracking: Fatawa changed on the official site
              await this.prisma.$transaction(async (tx) => {
                // Determine revision number
                const revisionsCount = await tx.fatwaRevision.count({
                  where: { fatwaId: existingFatwa.id }
                });

                // Save old revision
                await tx.fatwaRevision.create({
                  data: {
                    fatwaId: existingFatwa.id,
                    revisionNumber: revisionsCount + 1,
                    // Additional old fields could be saved as JSON if schema is expanded
                  }
                });

                // Update with new data
                await tx.fatwa.update({
                  where: { id: existingFatwa.id },
                  data: {
                    question: extractedData.question,
                    answer: extractedData.answer,
                    sourceFingerprint: newFingerprint,
                    updatedAt: new Date(),
                  }
                });
                
                // Refresh keywords on update
                await tx.fatwaKeyword.deleteMany({ where: { fatwaId: existingFatwa.id } });
                
                try {
                  const category = await tx.category.findUnique({ where: { id: extractedData.categoryId } });
                  const keywords = await this.keywordExtractor.extractKeywords({
                    question: extractedData.question,
                    answer: extractedData.answer,
                    categoryName: category?.name
                  });

                  for (const kw of keywords) {
                    const kwDb = await tx.keyword.upsert({
                      where: { word: kw },
                      update: {},
                      create: { word: kw }
                    });
                    await tx.fatwaKeyword.create({
                      data: { fatwaId: existingFatwa.id, keywordId: kwDb.id }
                    });
                  }
                } catch (kwErr) {
                  this.logger.warn(`Failed to update keywords for ${existingFatwa.slug}: ${kwErr.message}`);
                }
              });

              metrics.updated++;
            }
          } else {
            // New Fatwa
            const newFatwa = await this.prisma.fatwa.create({
              data: {
                slug: extractedData.slug,
                question: extractedData.question,
                answer: extractedData.answer,
                sourceFingerprint: newFingerprint,
                scholarId: extractedData.scholarId,
                categoryId: extractedData.categoryId,
                sourceId: source.id,
                officialUrl: extractedData.url,
                publishedAt: extractedData.publishedAt || new Date(),
                verificationStatus: 'verified', // Official importers are pre-verified
                attachments: {
                  create: (extractedData.attachments || []).map(a => ({ type: a.type, fileUrl: a.url, title: a.title }))
                }
              }
            });

            // Extract and save Keywords
            try {
              const category = await this.prisma.category.findUnique({ where: { id: extractedData.categoryId } });
              const keywords = await this.keywordExtractor.extractKeywords({
                question: extractedData.question,
                answer: extractedData.answer,
                categoryName: category?.name
              });

              for (const kw of keywords) {
                const kwDb = await this.prisma.keyword.upsert({
                  where: { word: kw },
                  update: {},
                  create: { word: kw }
                });
                await this.prisma.fatwaKeyword.upsert({
                  where: { fatwaId_keywordId: { fatwaId: newFatwa.id, keywordId: kwDb.id } },
                  update: {},
                  create: { fatwaId: newFatwa.id, keywordId: kwDb.id }
                });
              }
            } catch (kwErr) {
              this.logger.warn(`Failed to extract keywords for ${newFatwa.slug}: ${kwErr.message}`);
            }

            metrics.imported++;
          }
        } catch (itemError) {
          // Error Isolation: Do not stop the entire loop
          this.logger.error(`Error processing item in ${this.sourceSlug}`, itemError.stack);
          metrics.failed++;
        }

        // Save Progress / Checkpoint every 100 items
        processedCount++;
        if (processedCount % 100 === 0) {
          const currentIndex = startIndex + processedCount;
          await this.prisma.systemMetadata.upsert({
            where: { key: checkpointKey },
            update: { value: currentIndex.toString() },
            create: { key: checkpointKey, value: currentIndex.toString() }
          });
          
          // Print Live Progress
          console.log(`\n[PROGRESS] ${this.sourceName}: ${currentIndex} processed so far.`);
        }
      }

      // Save final checkpoint
      const finalIndex = startIndex + processedCount;
      await this.prisma.systemMetadata.upsert({
        where: { key: checkpointKey },
        update: { value: finalIndex.toString() },
        create: { key: checkpointKey, value: finalIndex.toString() }
      });

      const executionTime = Date.now() - startTime;
      const finalStatus = metrics.failed === processedCount && processedCount > 0 ? 'failed' : 'success';
      
      this.logger.log(`
=========================================
[END] Import complete for ${this.sourceName}
=========================================
Discovered (Processed from Generator): ${processedCount}
Imported (New): ${metrics.imported}
Updated: ${metrics.updated}
Duplicates: ${metrics.duplicated}
Skipped: ${metrics.skipped}
Failed: ${metrics.failed}
Time: ${executionTime}ms
=========================================`);

      // Phase 2: Smart Sync - Update Search Index in bulk for this source
      if (metrics.imported > 0 || metrics.updated > 0) {
        this.logger.log(`Updating Search Index for ${this.sourceName}...`);
        try {
          await this.prisma.$executeRawUnsafe(`
            INSERT INTO search_index (fatwa_id, normalized_text, updated_at)
            SELECT 
              f.id, 
              concat_ws(' ', f.question, f.answer, s.name, c.name), 
              NOW()
            FROM fatawa f
            LEFT JOIN scholars s ON f.scholar_id = s.id
            LEFT JOIN categories c ON f.category_id = c.id
            WHERE f.source_id = '${source.id}'
            ON CONFLICT (fatwa_id) DO UPDATE SET 
              normalized_text = EXCLUDED.normalized_text,
              updated_at = NOW();
          `);
    
          await this.prisma.$executeRawUnsafe(`
            UPDATE search_index si
            SET search_vector = 
              setweight(to_tsvector('arabic', coalesce(f.question, '') || ' ' || coalesce((SELECT string_agg(k.word, ' ') FROM fatwa_keywords fk JOIN keywords k ON fk.keyword_id = k.id WHERE fk.fatwa_id = f.id), '')), 'A') ||
              setweight(to_tsvector('arabic', coalesce(s.name, '') || ' ' || coalesce(c.name, '')), 'B') ||
              setweight(to_tsvector('arabic', coalesce(f.answer, '')), 'C')
            FROM fatawa f
            LEFT JOIN scholars s ON f.scholar_id = s.id
            LEFT JOIN categories c ON f.category_id = c.id
            WHERE f.id = si.fatwa_id AND f.source_id = '${source.id}';
          `);
          this.logger.log(`Search Index updated successfully for ${this.sourceName}.`);
        } catch (searchError) {
          this.logger.error(`Failed to update Search Index for ${this.sourceName}: ${searchError.message}`);
        }
      }

      // Save Import Job
      await this.prisma.importJob.create({
        data: {
          source: this.sourceSlug,
          startedAt: new Date(startTime),
          finishedAt: new Date(),
          duration: executionTime,
          status: finalStatus,
          importedCount: metrics.imported,
          updatedCount: metrics.updated,
          skippedCount: metrics.skipped,
          failedCount: metrics.failed
        }
      });

      // Update Sync Status
      await this.prisma.syncStatus.upsert({
        where: { source: this.sourceSlug },
        update: {
          lastSync: new Date(),
          nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
          status: 'idle',
          lastError: null
        },
        create: {
          source: this.sourceSlug,
          lastSync: new Date(),
          nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000),
          status: 'idle',
          lastError: null
        }
      });

      // Restore stale fatawa if they were marked as stale previously
      await this.prisma.fatwa.updateMany({
        where: { source: { slug: this.sourceSlug }, syncStatus: 'stale' },
        data: { syncStatus: 'active' }
      });

      return {
        source: this.sourceSlug,
        status: finalStatus,
        imported: metrics.imported,
        updated: metrics.updated,
        duplicated: metrics.duplicated,
        skipped: metrics.skipped,
        failed: metrics.failed,
        executionTime: executionTime,
      };

    } catch (criticalError) {
      this.logger.error(`[FATAL] Pipeline failed for ${this.sourceSlug}`, criticalError.stack);
      
      const executionTime = Date.now() - startTime;

      // Log Failed Job
      await this.prisma.importJob.create({
        data: {
          source: this.sourceSlug,
          startedAt: new Date(startTime),
          finishedAt: new Date(),
          duration: executionTime,
          status: 'failed',
          errorMessage: criticalError.message
        }
      });

      // Update Sync Status
      await this.prisma.syncStatus.upsert({
        where: { source: this.sourceSlug },
        update: {
          status: 'error',
          lastError: criticalError.message,
          nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000)
        },
        create: {
          source: this.sourceSlug,
          status: 'error',
          lastError: criticalError.message,
          nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000)
        }
      });

      // Mark all fatawa from this source as stale
      await this.prisma.fatwa.updateMany({
        where: { source: { slug: this.sourceSlug } },
        data: { syncStatus: 'stale' }
      });

      return {
        source: this.sourceSlug,
        status: 'failed',
        imported: 0,
        updated: 0,
        duplicated: 0,
        skipped: 0,
        failed: 1, 
        executionTime,
        details: criticalError.message,
      };
    }
  }
}
