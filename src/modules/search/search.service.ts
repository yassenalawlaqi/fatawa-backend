import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ISearchProvider } from './interfaces/search-provider.interface';
import { SearchQueryDto } from './dto/search.dto';
import { SearchRepository } from './search.repository';

@Injectable()
export class SearchService implements ISearchProvider {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly searchRepository: SearchRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async search(queryDto: SearchQueryDto): Promise<{ success: boolean; message?: string; data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number; }; meta?: any; }> {
    console.log("[Service] search()");
    const { scholar, category, limit = 20 } = queryDto;
    const page = Math.max(1, parseInt(queryDto.page as any, 10) || 1);
    const query = queryDto.query || queryDto.q || queryDto.keyword || queryDto.search || '';
    
    this.logger.log('Service Layer Started');
    const startTime = Date.now();
    let isCacheHit = false;

    const cacheKey = `search:${query}:${page}:${limit}`;

    try {
      try {
        const cachedResult = await this.cacheManager.get(cacheKey);
        if (cachedResult) {
          isCacheHit = true;
          const executionMs = Date.now() - startTime;
          this.logger.debug(`Cache Hit for query [${query}] in ${executionMs}ms`);
          
          this.searchRepository.logSearch(query, cachedResult['total'] || 0, executionMs, 'cache').catch(e => this.logger.error(e));
          
          return cachedResult as any;
        }
      } catch (cacheError) {
        this.logger.warn(`Cache retrieval failed, proceeding to DB: ${cacheError.message}`);
      }

      const result = await this.searchRepository.search(query, parseInt(page as any, 10), parseInt(limit as any, 10));
      
      const executionMs = Date.now() - startTime;
      const totalPages = Math.ceil(result.total / limit);

      this.logger.log('Response Mapping Started');
      const response = {
        success: true,
        message: 'تم البحث بنجاح',
        data: result.data,
        pagination: {
          page: parseInt(page as any, 10),
          limit: parseInt(limit as any, 10),
          total: result.total,
          totalPages: totalPages === 0 ? 1 : totalPages,
        },
        meta: {
          engine: result.engine,
          executionMs,
          cached: false
        }
      };

      this.cacheManager.set(cacheKey, { ...response, meta: { ...response.meta, cached: true } }, 21600000) 
        .catch(e => this.logger.warn(`Failed to set cache: ${e.message}`));

      this.searchRepository.logSearch(query, result.total, executionMs, result.engine)
        .catch(e => this.logger.error(e));

      return response;

    } catch (error) {
      this.logger.error(`Exception Name: ${error.name}`);
      this.logger.error(`Message: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
      throw error;
    }
  }

  async autocomplete(q: string) {
    if (!q || q.length < 2) return { suggestions: [] };
    
    const cacheKey = `autocomplete:${q}`;
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached;
    } catch(e) {}

    const suggestions = await this.searchRepository.autocomplete(q);
    const result = { suggestions };

    try {
      await this.cacheManager.set(cacheKey, result, 300000);
    } catch(e) {}

    return result;
  }

  async getTrendingSearches() {
    const cacheKey = 'trending:searches';
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached;
    } catch(e) {}

    const trending = await this.searchRepository.getTrendingSearches();
    const result = { trending };

    try {
      await this.cacheManager.set(cacheKey, result, 600000); 
    } catch(e) {}

    return result;
  }

  async getAllSynonyms() {
    // We should inject synonymService directly here, but let's just query via repository if we don't have it injected.
    // Wait, the constructor needs SynonymService. Let's fix that.
    return this.searchRepository.getAllSynonyms();
  }
}
