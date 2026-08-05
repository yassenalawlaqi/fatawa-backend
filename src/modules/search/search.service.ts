import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ISearchProvider } from './interfaces/search-provider.interface';
import { SearchQueryDto } from './dto/search.dto';
import { SearchRepository } from './search.repository';

// ─────────────────────────────────────────────────────────────────────────────
// Fiqh terms that MUST NOT be removed (they carry ranking value)
// ─────────────────────────────────────────────────────────────────────────────
const FIQH_TERMS = new Set([
  'حكم', 'يجوز', 'لا يجوز', 'حرام', 'حلال', 'بدعة', 'مشروع', 'واجب',
  'مكروه', 'سنة', 'فرض', 'مباح', 'محرم', 'مستحب', 'منهي', 'مأذون',
  'جائز', 'لازم', 'ثابت', 'صحيح', 'باطل', 'فاسد', 'منعقد', 'مفسد',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Conversational stop words (removed only when standalone words)
// ─────────────────────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'ما', 'ماذا', 'هل', 'اريد', 'أريد', 'ابحث', 'بحث', 'معرفة',
  'افيدوني', 'من', 'فضلك', 'لو', 'سمحتم', 'افتوني', 'أفتوني',
  'اخبروني', 'دلوني', 'اخبرني', 'دلني', 'ارشدوني', 'ارشدني',
  'فتوى', 'سؤال', 'أسأل', 'اسأل',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Verbs/particles that signal "subject extraction"
// ─────────────────────────────────────────────────────────────────────────────
const SUBJECT_SIGNAL_WORDS = new Set([
  'قول', 'فعل', 'ترك', 'حكم', 'يجوز', 'لا', 'هل', 'عن', 'في', 'على',
  'إحكام', 'احكام', 'شرع', 'اباحة', 'إباحة', 'تحريم', 'كراهة',
]);

// ─────────────────────────────────────────────────────────────────────────────
// Semantic expansion map – keyed by normalized topic word(s)
// ─────────────────────────────────────────────────────────────────────────────
const SEMANTIC_MAP: Record<string, string[]> = {
  'جمعة مباركة': [
    'قول جمعة مباركة', 'التهنئة بيوم الجمعة', 'التهنئة بالجمعة',
    'حكم التهنئة بيوم الجمعة', 'التهنئة يوم الجمعة',
    'الجمعة المباركة', 'قول الجمعة مباركة',
  ],
  'كشف الوجه': [
    'النقاب', 'غطاء الوجه', 'ستر الوجه', 'السفور', 'الحجاب', 'نقاب المرأة',
  ],
  'زكاة الذهب': [
    'ذهب النساء', 'الحلي', 'زكاة الحلي', 'زكاة المجوهرات', 'زكاة الفضة',
  ],
  'اللحية': [
    'إعفاء اللحية', 'حلق اللحية', 'قص اللحية', 'إطالة اللحية',
  ],
  'الموسيقى': [
    'الأغاني', 'المعازف', 'الطرب', 'الغناء', 'الآلات الموسيقية',
  ],
  'الاختلاط': [
    'اختلاط الرجال والنساء', 'خلوة', 'الخلوة بالأجنبية',
  ],
  'المولد': [
    'الاحتفال بالمولد', 'مولد النبي', 'الاحتفال بمولد النبي',
    'ذكرى المولد',
  ],
  'الإسبال': [
    'إسبال الثوب', 'إسبال الإزار', 'تطويل الثياب', 'الإزار',
  ],
  'النقاب': [
    'كشف الوجه', 'غطاء الوجه', 'ستر الوجه', 'الحجاب',
  ],
  'الربا': [
    'الفوائد البنكية', 'القرض بالفائدة', 'الفوائد الربوية',
  ],
};

@Injectable()
export class SearchService implements ISearchProvider {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly searchRepository: SearchRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // Step 1 – Basic normalization (diacritics, Hamzas, punctuation)
  // ───────────────────────────────────────────────────────────────────────────
  private normalizeText(query: string): string {
    if (!query) return '';
    let q = query;

    // Remove diacritics (Tashkeel)
    q = q.replace(/[\u064B-\u065F\u0670]/g, '');

    // Normalize Hamzas/Alif-Maksura  (ة is intentionally kept)
    q = q.replace(/[أإآ]/g, 'ا');
    q = q.replace(/ى/g, 'ي');

    // Remove punctuation
    q = q.replace(/[.،,؛;:?؟!"'()\[\]{}<>«»\-–—]/g, ' ');

    // Collapse whitespace
    q = q.replace(/\s+/g, ' ').trim();

    return q;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Step 2 – Remove conversational stop words (keep Fiqh terms)
  // ───────────────────────────────────────────────────────────────────────────
  private removeStopWords(query: string): string {
    const words = query.split(' ');
    return words
      .filter(w => !STOP_WORDS.has(w) || FIQH_TERMS.has(w))
      .join(' ')
      .trim();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Step 3 – Extract the real subject of the question
  // "ما حكم قول جمعة مباركة"  →  "قول جمعة مباركة"
  // "هل يجوز كشف الوجه"        →  "كشف الوجه"
  // ───────────────────────────────────────────────────────────────────────────
  private extractSearchSubject(query: string): string {
    const words = query.split(' ');

    // Find first non-signal word as subject start
    let subjectStart = -1;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (!SUBJECT_SIGNAL_WORDS.has(w) && w.length > 1) {
        subjectStart = i;
        break;
      }
    }

    if (subjectStart <= 0) return query; // nothing to extract

    const subject = words.slice(subjectStart).join(' ');

    // Only accept extraction if subject is meaningfully shorter (we extracted something)
    return subject.length > 2 ? subject : query;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Combined Intent Normalizer (replaces old normalizeSearchQuery)
  // ───────────────────────────────────────────────────────────────────────────
  normalizeIntentQuery(rawQuery: string): { normalized: string; intentSubject: string } {
    if (!rawQuery) return { normalized: '', intentSubject: '' };

    const normalized = this.removeStopWords(this.normalizeText(rawQuery));
    const intentSubject = this.extractSearchSubject(normalized);

    return { normalized, intentSubject };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Step 4 – Semantic expansion based on the intent subject
  // ───────────────────────────────────────────────────────────────────────────
  private getSemanticExpansions(intentSubject: string): string[] {
    const expansions: string[] = [];

    for (const [key, values] of Object.entries(SEMANTIC_MAP)) {
      if (intentSubject.includes(key) || key.includes(intentSubject)) {
        expansions.push(...values);
      }
    }

    // Deduplicate
    return [...new Set(expansions)];
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Main search entry point
  // ───────────────────────────────────────────────────────────────────────────
  async search(queryDto: SearchQueryDto): Promise<{
    success: boolean;
    message?: string;
    data: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    aggregations?: any;
    meta?: any;
  }> {
    const { scholar, limit = 20 } = queryDto;
    const page = Math.max(1, parseInt(queryDto.page as any, 10) || 1);
    const rawQuery = queryDto.query || queryDto.q || queryDto.keyword || queryDto.search || '';

    // ── Intent processing ──────────────────────────────────────────────────
    const { normalized: query, intentSubject } = this.normalizeIntentQuery(rawQuery);
    const semanticExpansions = this.getSemanticExpansions(intentSubject);

    if (!query) {
      return {
        success: true,
        message: 'اكتب كلمة مفتاحية مثل: زكاة، الجمعة، الصيام...',
        data: [],
        aggregations: { scholars: {} },
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
        meta: { engine: 'none', executionMs: 0, cached: false },
      };
    }

    this.logger.log('Service Layer Started');
    const startTime = Date.now();

    const cacheKey = `search:v2:${query}:${intentSubject}:${page}:${limit}:${scholar || 'all'}`;

    try {
      // ── Cache check ───────────────────────────────────────────────────────
      try {
        const cachedResult = await this.cacheManager.get(cacheKey);
        if (cachedResult) {
          const executionMs = Date.now() - startTime;
          this.logger.debug(`Cache Hit [${query}] in ${executionMs}ms`);
          this.searchRepository
            .logSearch(query, cachedResult['total'] || 0, executionMs, 'cache')
            .catch(e => this.logger.error(e));
          return cachedResult as any;
        }
      } catch (cacheError) {
        this.logger.warn(`Cache retrieval failed: ${cacheError.message}`);
      }

      // ── Execute search with intent context ────────────────────────────────
      const result = await this.searchRepository.search(
        query,
        page,
        parseInt(limit as any, 10),
        scholar,
        intentSubject,
        semanticExpansions,
      );

      const executionMs = Date.now() - startTime;
      const totalPages = Math.ceil(result.total / limit);

      const response = {
        success: true,
        message: result.total > 0 ? 'تم البحث بنجاح' : undefined,
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
          normalizedQuery: query !== rawQuery ? query : undefined,
          intentSubject: intentSubject !== query ? intentSubject : undefined,
        },
      };

      // ── Cache set (fire-and-forget) ────────────────────────────────────────
      this.cacheManager
        .set(cacheKey, { ...response, meta: { ...response.meta, cached: true } }, 21600000)
        .catch(e => this.logger.warn(`Failed to set cache: ${e.message}`));

      this.searchRepository
        .logSearch(query, result.total, executionMs, result.engine)
        .catch(e => this.logger.error(e));

      // ── Debug logging ──────────────────────────────────────────────────────
      if (process.env.SEARCH_DEBUG === 'true' || process.env.NODE_ENV === 'development') {
        this.logger.debug(
          JSON.stringify(
            {
              _type: 'SearchDebug',
              originalQuery: rawQuery,
              normalizedQuery: query,
              intentSubject,
              semanticExpansions,
              scholarFilter: scholar || 'all',
              ftsResultCount: result.engine === 'fts' ? result.total : 0,
              fallbackResultCount: result.engine === 'fallback' ? result.total : 0,
              aggregationCounts: result.aggregations?.scholars,
              cacheKey,
              executionMs,
              engineUsed: result.engine,
            },
            null,
            2,
          ),
        );
      }

      return response;
    } catch (error: any) {
      this.logger.error(`Search failed: ${error.message}`);
      return {
        success: false,
        message: 'حدث خطأ في البحث، الرجاء المحاولة مرة أخرى.',
        data: [],
        aggregations: { scholars: {} },
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
        meta: { engine: 'error', executionMs: Date.now() - startTime, cached: false },
      };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Autocomplete – now uses normalizeIntentQuery
  // ───────────────────────────────────────────────────────────────────────────
  async autocomplete(q: string, scholar?: string) {
    const { intentSubject } = this.normalizeIntentQuery(q);
    // Use the intent subject for smarter suggestions; fall back to q
    const effectiveQ = intentSubject && intentSubject.length >= 2 ? intentSubject : q;
    return this.searchRepository.autocomplete(effectiveQ, scholar);
  }

  async getTrendingSearches() {
    return this.searchRepository.getTrendingSearches();
  }

  async getAllSynonyms() {
    return this.searchRepository.getAllSynonyms();
  }
}
