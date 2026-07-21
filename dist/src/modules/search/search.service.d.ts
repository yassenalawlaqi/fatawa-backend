import type { Cache } from 'cache-manager';
import { ISearchProvider } from './interfaces/search-provider.interface';
import { SearchQueryDto } from './dto/search.dto';
import { SearchRepository } from './search.repository';
export declare class SearchService implements ISearchProvider {
    private readonly searchRepository;
    private cacheManager;
    private readonly logger;
    constructor(searchRepository: SearchRepository, cacheManager: Cache);
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
        meta?: any;
    }>;
    autocomplete(q: string): Promise<{}>;
    getTrendingSearches(): Promise<{}>;
}
