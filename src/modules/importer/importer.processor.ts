import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ImporterService } from './importer.service';

@Processor('import-queue')
export class ImporterProcessor extends WorkerHost {
  private readonly logger = new Logger(ImporterProcessor.name);

  constructor(private readonly importerService: ImporterService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    
    if (job.name === 'run-import') {
      const sourceSlug = job.data.sourceSlug;
      return this.importerService.executeImport(sourceSlug);
    }
  }
}
