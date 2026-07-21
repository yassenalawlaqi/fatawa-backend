import { PrismaService } from '../prisma/prisma.service';
export interface SearchResult {
    id: string;
    slug: string;
    questionTitle: string;
    question: string;
    answer: string;
    scholar: string;
    category: string;
    source: string;
    score?: number;
}
export declare class SearchRepository {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    search(query: string, page?: number, limit?: number): Promise<{
        data: SearchResult[];
        total: number;
        engine: 'fts' | 'fallback';
    }>;
    searchFTS(query: string, page: number, limit: number): Promise<{
        data: SearchResult[];
        total: number;
    }>;
    searchFallback(query: string, page: number, limit: number): Promise<{
        data: SearchResult[];
        total: number;
    }>;
    autocomplete(q: string): Promise<{
        term: string;
    }[]>;
    logSearch(query: string, resultsCount: number, executionMs: number, engine: string): Promise<void>;
    getTrendingSearches(): Promise<string[]>;
    rebuildSearchIndex(): Promise<void>;
}
