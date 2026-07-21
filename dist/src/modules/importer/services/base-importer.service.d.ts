import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FatwaData, ImportResult, IImporter } from '../interfaces/i-importer.interface';
export declare abstract class BaseImporterService implements IImporter {
    protected readonly prisma: PrismaService;
    abstract readonly sourceName: string;
    abstract readonly sourceSlug: string;
    abstract readonly officialUrl: string;
    protected readonly logger: Logger;
    constructor(prisma: PrismaService);
    abstract fetchRawItems(): Promise<any[]>;
    abstract extractFatwaData(rawItem: any): Promise<FatwaData>;
    protected calculateFingerprint(officialUrl: string, question: string, answer: string): string;
    runImportPipeline(): Promise<ImportResult>;
}
