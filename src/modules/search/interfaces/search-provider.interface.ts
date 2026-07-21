import { SearchQueryDto } from '../dto/search.dto';

export interface ISearchProvider {
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
}
