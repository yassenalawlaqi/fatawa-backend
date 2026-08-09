import type { Cache } from 'cache-manager';
import { ISearchProvider } from './interfaces/search-provider.interface';
import { SearchQueryDto } from './dto/search.dto';
import { SearchRepository } from './search.repository';
export declare class SearchService implements ISearchProvider {
    private readonly searchRepository;
    private cacheManager;
    private readonly logger;
    constructor(searchRepository: SearchRepository, cacheManager: Cache);
    private normalizeText;
    private removeStopWords;
    private extractSearchSubject;
    normalizeIntentQuery(rawQuery: string): {
        normalized: string;
        intentSubject: string;
    };
    private getSemanticExpansions;
    search(queryDto: SearchQueryDto): Promise<{
        success: boolean;
        message?: string;
        data: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        aggregations?: any;
        meta?: any;
    }>;
    autocomplete(q: string, scholar?: string): Promise<{
        term: string;
    }[]>;
    getTrendingSearches(): Promise<string[]>;
    getAllSynonyms(): Promise<{
        id: string;
        word: string;
        synonym: string;
    }[]>;
}
