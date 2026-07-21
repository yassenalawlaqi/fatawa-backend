import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ImporterService } from './importer.service';
export declare class ImporterProcessor extends WorkerHost {
    private readonly importerService;
    private readonly logger;
    constructor(importerService: ImporterService);
    process(job: Job<any, any, string>): Promise<any>;
}
