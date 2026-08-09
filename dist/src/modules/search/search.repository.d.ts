import { PrismaService } from '../prisma/prisma.service';
import { SynonymService } from './synonym.service';
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
    private readonly synonymService;
    private readonly logger;
    constructor(prisma: PrismaService, synonymService: SynonymService);
    search(query: string, page?: number, limit?: number, scholar?: string, intentSubject?: string, semanticExpansions?: string[]): Promise<{
        data: SearchResult[];
        total: number;
        engine: 'fts' | 'fallback';
        aggregations?: any;
    }>;
    searchFTS(query: string, page: number, limit: number, scholar?: string, intentSubject?: string, semanticExpansions?: string[]): Promise<{
        data: SearchResult[];
        total: number;
        aggregations: any;
    }>;
    searchFallback(query: string, page: number, limit: number, scholar?: string, intentSubject?: string): Promise<{
        data: SearchResult[];
        total: number;
        aggregations: any;
    }>;
    autocomplete(q: string, scholar?: string): Promise<{
        term: string;
    }[]>;
    logSearch(query: string, resultsCount: number, executionMs: number, engine: string): Promise<void>;
    getTrendingSearches(): Promise<string[]>;
    getAllSynonyms(): Promise<{
        id: string;
        word: string;
        synonym: string;
    }[]>;
    rebuildSearchIndex(): Promise<void>;
    rebuildSearchIndexForSource(sourceId: string): Promise<void>;
}
