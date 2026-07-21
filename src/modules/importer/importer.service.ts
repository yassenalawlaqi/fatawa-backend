import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IImporter } from './interfaces/i-importer.interface';
import { ImporterProcessor } from './importer.processor';
import { BinBazImporter } from './plugins/binbaz.importer';
import { UthaymeenImporter } from './plugins/uthaymeen.importer';
import { FawzanImporter } from './plugins/fawzan.importer';
import { PermanentCommitteeImporter } from './plugins/committee.importer';
import { AuditService } from '../system/audit.service';
import { SearchRepository } from '../search/search.repository';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ImporterService implements OnModuleInit {
  private readonly logger = new Logger(ImporterService.name);
  private plugins: Map<string, IImporter> = new Map();

  constructor(
    @InjectQueue('import-queue') private importQueue: Queue,
    private binbazImporter: BinBazImporter,
    private uthaymeenImporter: UthaymeenImporter,
    private fawzanImporter: FawzanImporter,
    private committeeImporter: PermanentCommitteeImporter,
    private auditService: AuditService,
    private searchRepository: SearchRepository,
  ) {
    this.registerPlugin(this.binbazImporter);
    this.registerPlugin(this.uthaymeenImporter);
    this.registerPlugin(this.fawzanImporter);
    this.registerPlugin(this.committeeImporter);
  }

  onModuleInit() {
  }

  private registerPlugin(plugin: IImporter) {
    this.plugins.set(plugin.sourceSlug, plugin);
    this.logger.log(`Registered Importer Plugin: ${plugin.sourceName}`);
  }

  async scheduleImport(sourceSlug: string) {
    if (sourceSlug === 'all') {
      for (const [slug] of this.plugins) {
        await this.importQueue.add('run-import', { sourceSlug: slug });
      }
      this.logger.log(`Scheduled import for ALL sources`);
      return { success: true, message: 'Scheduled imports for all sources' };
    }

    if (!this.plugins.has(sourceSlug)) {
      throw new Error(`Plugin ${sourceSlug} not found`);
    }
    await this.importQueue.add('run-import', { sourceSlug });
    this.logger.log(`Scheduled import for ${sourceSlug}`);
    return { success: true, message: `Scheduled import for ${sourceSlug}` };
  }

  async executeImport(sourceSlug: string) {
    const plugin = this.plugins.get(sourceSlug);
    if (!plugin) throw new Error(`Plugin not found for ${sourceSlug}`);

    this.logger.log(`Executing import pipeline for ${plugin.sourceName}...`);
    const result = await plugin.runImportPipeline();
    
    await this.auditService.logAction(
      'RUN_IMPORT',
      'ImportLog',
      '00000000-0000-0000-0000-000000000000',
      JSON.stringify(result)
    );

    // Rebuild Search Index after individual import
    await this.searchRepository.rebuildSearchIndex();

    return result;
  }

  // Cron Job: Run Importer every 6 hours
  @Cron('0 */6 * * *')
  async handleCron() {
    this.logger.log('Running scheduled imports (every 6 hours)...');
    try {
      await this.scheduleImport('all');
    } catch (e) {
      this.logger.error(`Failed to schedule imports: ${e.message}`);
    }
  }

  getSyncStatus() {
    return this.plugins.keys(); // Basic placeholder, could fetch from DB
  }
}
