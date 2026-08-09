import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FatwaData, ImportResult, IImporter } from '../interfaces/i-importer.interface';
import { KeywordExtractorService } from '../../search/keyword-extractor.service';
export declare abstract class BaseImporterService implements IImporter {
    protected readonly prisma: PrismaService;
    protected readonly keywordExtractor: KeywordExtractorService;
    abstract readonly sourceName: string;
    abstract readonly sourceSlug: string;
    abstract readonly officialUrl: string;
    protected readonly logger: Logger;
    constructor(prisma: PrismaService, keywordExtractor: KeywordExtractorService);
    abstract fetchRawItems(startIndex: number): AsyncGenerator<any, void, unknown>;
    abstract extractFatwaData(rawItem: any): Promise<FatwaData>;
    protected calculateFingerprint(officialUrl: string, question: string, answer: string): string;
    runImportPipeline(): Promise<ImportResult>;
}
