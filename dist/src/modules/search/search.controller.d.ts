import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search.dto';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    private readonly logger;
    searchGet(query: SearchQueryDto): Promise<{
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
    searchPost(query: SearchQueryDto): Promise<{
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
    trending(): Promise<{}>;
}
