import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FatwaData, ImportResult, IImporter } from '../interfaces/i-importer.interface';
import { FatwaValidator } from '../utils/fatwa-validator.util';
import * as crypto from 'crypto';

export abstract class BaseImporterService implements IImporter {
  abstract readonly sourceName: string;
  abstract readonly sourceSlug: string;
  abstract readonly officialUrl: string;

  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Defines the strategy for fetching raw items (URLs, RSS items, JSON objects)
   */
  abstract fetchRawItems(): Promise<any[]>;

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

      const rawItems = await this.fetchRawItems();
      this.logger.log(`Found ${rawItems.length} items to process from ${this.sourceName}.`);

      for (const item of rawItems) {
        try {
          const extractedData = await this.extractFatwaData(item);
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
              });

              metrics.updated++;
            }
          } else {
            // New Fatwa
            await this.prisma.fatwa.create({
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
            metrics.imported++;
          }
        } catch (itemError) {
          // Error Isolation: Do not stop the entire loop
          this.logger.error(`Error processing item in ${this.sourceSlug}`, itemError.stack);
          metrics.failed++;
        }
      }

      const executionTime = Date.now() - startTime;
      const finalStatus = metrics.failed === rawItems.length && rawItems.length > 0 ? 'failed' : 'success';
      
      this.logger.log(`[END] Import complete for ${this.sourceName}. Time: ${executionTime}ms. Imported: ${metrics.imported}, Updated: ${metrics.updated}, Skipped: ${metrics.skipped}, Failed: ${metrics.failed}, Duplicated: ${metrics.duplicated}`);

      // Phase 2: Smart Sync - Update Search Index in bulk for this source
      if (metrics.imported > 0 || metrics.updated > 0) {
        this.logger.log(`Updating Search Index for ${this.sourceName}...`);
        try {
          await this.prisma.$executeRawUnsafe(`
            INSERT INTO search_index (fatwa_id, normalized_text, updated_at)
            SELECT id, question || ' ' || answer, NOW()
            FROM fatawa
            WHERE source_id = '${source.id}'
            ON CONFLICT (fatwa_id) DO UPDATE SET 
              normalized_text = EXCLUDED.normalized_text,
              updated_at = NOW();
          `);
    
          await this.prisma.$executeRawUnsafe(`
            UPDATE search_index
            SET search_vector = to_tsvector('arabic', normalized_text)
            WHERE fatwa_id IN (SELECT id FROM fatawa WHERE source_id = '${source.id}');
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
