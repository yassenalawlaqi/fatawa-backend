import { PrismaService } from '../../prisma/prisma.service';
import { BaseImporterService } from '../services/base-importer.service';
import { ContentExtractorService } from '../services/content-extractor.service';
import { FatwaData } from '../interfaces/i-importer.interface';
import { KeywordExtractorService } from '../../search/keyword-extractor.service';
export declare class UthaymeenImporter extends BaseImporterService {
    protected readonly prisma: PrismaService;
    private readonly extractor;
    protected readonly keywordExtractor: KeywordExtractorService;
    readonly sourceName = "\u0645\u0648\u0642\u0639 \u0627\u0644\u0634\u064A\u062E \u0645\u062D\u0645\u062F \u0628\u0646 \u0635\u0627\u0644\u062D \u0627\u0644\u0639\u062B\u064A\u0645\u064A\u0646";
    readonly sourceSlug = "uthaymeen-official";
    readonly officialUrl = "https://binothaimeen.net";
    constructor(prisma: PrismaService, extractor: ContentExtractorService, keywordExtractor: KeywordExtractorService);
    fetchRawItems(): Promise<any[]>;
    extractFatwaData(rawItem: {
        url: string;
    }): Promise<FatwaData>;
}
