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

  /**
   * Normalizes the search query by removing stop words, punctuation, diacritics,
   * and unifying Hamzas/Alifs.
   */
  private normalizeSearchQuery(query: string): string {
    if (!query) return '';
    let normalized = query;

    // 1. Remove diacritics (Tashkeel)
    normalized = normalized.replace(/[\u064B-\u065F\u0670]/g, '');

    // 2. Normalize Hamzas and Alif Maksura (أ، إ، آ -> ا) (ى -> ي)
    normalized = normalized.replace(/[أإآ]/g, 'ا');
    normalized = normalized.replace(/ى/g, 'ي');

    // 3. Remove punctuation
    normalized = normalized.replace(/[.،,؛;:?؟!"'()[\]{}<>«»-]/g, ' ');

    // 4. Remove conversational stop words (but keep valid Fiqh terms like حكم, يجوز)
    const stopWords = ['ما', 'ماذا', 'هل', 'اريد', 'معرفة', 'افيدوني', 'من', 'فضلك', 'لو', 'سمحتم', 'افتوني'];
    const words = normalized.split(/\s+/);
    const filteredWords = words.filter(word => !stopWords.includes(word));

    // 5. Clean up extra spaces
    return filteredWords.join(' ').trim();
  }

  async search(queryDto: SearchQueryDto): Promise<{ success: boolean; message?: string; data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number; }; aggregations?: any; meta?: any; }> {
    console.log("[Service] search()");
    const { scholar, category, limit = 20 } = queryDto;
    const page = Math.max(1, parseInt(queryDto.page as any, 10) || 1);
    const rawQuery = queryDto.query || queryDto.q || queryDto.keyword || queryDto.search || '';
    
    // Normalize query
    const query = this.normalizeSearchQuery(rawQuery) || '';
    
    // If query is empty after normalization (only stop words)
    if (!query) {
      return {
        success: true,
        message: 'اكتب كلمة مفتاحية مثل: زكاة، الجمعة، الصيام...',
        data: [],
        aggregations: { scholars: {} },
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
        meta: { engine: 'none', executionMs: 0, cached: false }
      };
    }

    this.logger.log('Service Layer Started');
    const startTime = Date.now();
    let isCacheHit = false;

    const cacheKey = `search:${query}:${page}:${limit}:${scholar || 'all'}`;

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

      const result = await this.searchRepository.search(query, parseInt(page as any, 10), parseInt(limit as any, 10), scholar);
      
      const executionMs = Date.now() - startTime;
      const totalPages = Math.ceil(result.total / limit);

      this.logger.log('Response Mapping Started');
      const response = {
        success: true,
        message: 'تم البحث بنجاح',
        data: result.data,
        aggregations: result.aggregations,
        pagination: {
          page: parseInt(page as any, 10),
          limit: parseInt(limit as any, 10),
          total: result.total,
          totalPages: totalPages === 0 ? 1 : totalPages,
        },
        meta: {
          engine: result.engine,
          executionMs,
          cached: false,
          normalizedQuery: query !== rawQuery ? query : undefined
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

  async autocomplete(q: string, scholar?: string) {
    if (!q || q.length < 2) return { suggestions: [] };
    
    const query = this.normalizeSearchQuery(q) || '';
    if (!query) return { suggestions: [] };

    const cacheKey = `autocomplete:${query}:${scholar || 'all'}`;
    try {
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached;
    } catch(e) {}

    const suggestions = await this.searchRepository.autocomplete(query, scholar);
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
    return this.searchRepository.getAllSynonyms();
  }
}

