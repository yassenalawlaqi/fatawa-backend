import { OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { BinBazImporter } from './plugins/binbaz.importer';
import { UthaymeenImporter } from './plugins/uthaymeen.importer';
import { FawzanImporter } from './plugins/fawzan.importer';
import { PermanentCommitteeImporter } from './plugins/committee.importer';
import { AuditService } from '../system/audit.service';
import { SearchRepository } from '../search/search.repository';
export declare class ImporterService implements OnModuleInit {
    private importQueue;
    private binbazImporter;
    private uthaymeenImporter;
    private fawzanImporter;
    private committeeImporter;
    private auditService;
    private searchRepository;
    private readonly logger;
    private plugins;
    constructor(importQueue: Queue, binbazImporter: BinBazImporter, uthaymeenImporter: UthaymeenImporter, fawzanImporter: FawzanImporter, committeeImporter: PermanentCommitteeImporter, auditService: AuditService, searchRepository: SearchRepository);
    onModuleInit(): void;
    private registerPlugin;
    scheduleImport(sourceSlug: string): Promise<{
        success: boolean;
        message: string;
    }>;
    executeImport(sourceSlug: string): Promise<import("./interfaces/i-importer.interface").ImportResult>;
    handleCron(): Promise<void>;
    getSyncStatus(): MapIterator<string>;
}
