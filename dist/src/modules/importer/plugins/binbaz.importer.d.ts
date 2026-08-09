import { PrismaService } from '../../prisma/prisma.service';
import { BaseImporterService } from '../services/base-importer.service';
import { ContentExtractorService } from '../services/content-extractor.service';
import { FatwaData } from '../interfaces/i-importer.interface';
import { KeywordExtractorService } from '../../search/keyword-extractor.service';
export declare class BinBazImporter extends BaseImporterService {
    protected readonly prisma: PrismaService;
    private readonly extractor;
    protected readonly keywordExtractor: KeywordExtractorService;
    readonly sourceName = "\u0627\u0644\u0645\u0648\u0642\u0639 \u0627\u0644\u0631\u0633\u0645\u064A \u0644\u0644\u0625\u0645\u0627\u0645 \u0627\u0628\u0646 \u0628\u0627\u0632";
    readonly sourceSlug = "binbaz-official";
    readonly officialUrl = "https://binbaz.org.sa";
    constructor(prisma: PrismaService, extractor: ContentExtractorService, keywordExtractor: KeywordExtractorService);
    fetchRawItems(startIndex: number): AsyncGenerator<any, void, unknown>;
    extractFatwaData(rawItem: {
        url: string;
    }): Promise<FatwaData>;
}
