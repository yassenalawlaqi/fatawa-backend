import { PrismaService } from '../../prisma/prisma.service';
import { BaseImporterService } from '../services/base-importer.service';
import { ContentExtractorService } from '../services/content-extractor.service';
import { FatwaData } from '../interfaces/i-importer.interface';
export declare class PermanentCommitteeImporter extends BaseImporterService {
    protected readonly prisma: PrismaService;
    private readonly extractor;
    readonly sourceName = "\u0627\u0644\u0644\u062C\u0646\u0629 \u0627\u0644\u062F\u0627\u0626\u0645\u0629 \u0644\u0644\u0628\u062D\u0648\u062B \u0627\u0644\u0639\u0644\u0645\u064A\u0629 \u0648\u0627\u0644\u0625\u0641\u062A\u0627\u0621";
    readonly sourceSlug = "committee-official";
    readonly officialUrl = "https://alifta.gov.sa";
    constructor(prisma: PrismaService, extractor: ContentExtractorService);
    fetchRawItems(): Promise<any[]>;
    extractFatwaData(rawItem: {
        url: string;
    }): Promise<FatwaData>;
}
