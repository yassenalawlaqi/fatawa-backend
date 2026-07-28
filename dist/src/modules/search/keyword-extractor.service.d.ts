import { PrismaService } from '../prisma/prisma.service';
export declare class KeywordExtractorService {
    private readonly prisma;
    private readonly logger;
    private readonly coreTerms;
    constructor(prisma: PrismaService);
    extractKeywords(params: {
        question: string;
        answer: string;
        categoryName?: string;
    }): Promise<string[]>;
}
