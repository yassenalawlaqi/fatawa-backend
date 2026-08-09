"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const search_repository_1 = require("./search.repository");
const FIQH_TERMS = new Set([
    'حكم', 'يجوز', 'لا يجوز', 'حرام', 'حلال', 'بدعة', 'مشروع', 'واجب',
    'مكروه', 'سنة', 'فرض', 'مباح', 'محرم', 'مستحب', 'منهي', 'مأذون',
    'جائز', 'لازم', 'ثابت', 'صحيح', 'باطل', 'فاسد', 'منعقد', 'مفسد',
]);
const STOP_WORDS = new Set([
    'ما', 'ماذا', 'هل', 'اريد', 'أريد', 'ابحث', 'بحث', 'معرفة',
    'افيدوني', 'من', 'فضلك', 'لو', 'سمحتم', 'افتوني', 'أفتوني',
    'اخبروني', 'دلوني', 'اخبرني', 'دلني', 'ارشدوني', 'ارشدني',
    'فتوى', 'سؤال', 'أسأل', 'اسأل',
]);
const SUBJECT_SIGNAL_WORDS = new Set([
    'قول', 'فعل', 'ترك', 'حكم', 'يجوز', 'لا', 'هل', 'عن', 'في', 'على',
    'إحكام', 'احكام', 'شرع', 'اباحة', 'إباحة', 'تحريم', 'كراهة',
]);
const SEMANTIC_MAP = {
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
let SearchService = SearchService_1 = class SearchService {
    searchRepository;
    cacheManager;
    logger = new common_1.Logger(SearchService_1.name);
    constructor(searchRepository, cacheManager) {
        this.searchRepository = searchRepository;
        this.cacheManager = cacheManager;
    }
    normalizeText(query) {
        if (!query)
            return '';
        let q = query;
        q = q.replace(/[\u064B-\u065F\u0670]/g, '');
        q = q.replace(/[أإآ]/g, 'ا');
        q = q.replace(/ى/g, 'ي');
        q = q.replace(/[.،,؛;:?؟!"'()\[\]{}<>«»\-–—]/g, ' ');
        q = q.replace(/\s+/g, ' ').trim();
        return q;
    }
    removeStopWords(query) {
        const words = query.split(' ');
        return words
            .filter(w => !STOP_WORDS.has(w) || FIQH_TERMS.has(w))
            .join(' ')
            .trim();
    }
    extractSearchSubject(query) {
        const words = query.split(' ');
        let subjectStart = -1;
        for (let i = 0; i < words.length; i++) {
            const w = words[i];
            if (!SUBJECT_SIGNAL_WORDS.has(w) && w.length > 1) {
                subjectStart = i;
                break;
            }
        }
        if (subjectStart <= 0)
            return query;
        const subject = words.slice(subjectStart).join(' ');
        return subject.length > 2 ? subject : query;
    }
    normalizeIntentQuery(rawQuery) {
        if (!rawQuery)
            return { normalized: '', intentSubject: '' };
        const normalized = this.removeStopWords(this.normalizeText(rawQuery));
        const intentSubject = this.extractSearchSubject(normalized);
        return { normalized, intentSubject };
    }
    getSemanticExpansions(intentSubject) {
        const expansions = [];
        for (const [key, values] of Object.entries(SEMANTIC_MAP)) {
            if (intentSubject.includes(key) || key.includes(intentSubject)) {
                expansions.push(...values);
            }
        }
        return [...new Set(expansions)];
    }
    async search(queryDto) {
        const { scholar, limit = 20 } = queryDto;
        const page = Math.max(1, parseInt(queryDto.page, 10) || 1);
        const rawQuery = queryDto.query || queryDto.q || queryDto.keyword || queryDto.search || '';
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
            try {
                const cachedResult = await this.cacheManager.get(cacheKey);
                if (cachedResult) {
                    const executionMs = Date.now() - startTime;
                    this.logger.debug(`Cache Hit [${query}] in ${executionMs}ms`);
                    this.searchRepository
                        .logSearch(query, cachedResult['total'] || 0, executionMs, 'cache')
                        .catch(e => this.logger.error(e));
                    return cachedResult;
                }
            }
            catch (cacheError) {
                this.logger.warn(`Cache retrieval failed: ${cacheError.message}`);
            }
            const result = await this.searchRepository.search(query, page, parseInt(limit, 10), scholar, intentSubject, semanticExpansions);
            const executionMs = Date.now() - startTime;
            const totalPages = Math.ceil(result.total / limit);
            const response = {
                success: true,
                message: result.total > 0 ? 'تم البحث بنجاح' : undefined,
                data: result.data,
                aggregations: result.aggregations,
                pagination: {
                    page: parseInt(page, 10),
                    limit: parseInt(limit, 10),
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
            this.cacheManager
                .set(cacheKey, { ...response, meta: { ...response.meta, cached: true } }, 21600000)
                .catch(e => this.logger.warn(`Failed to set cache: ${e.message}`));
            this.searchRepository
                .logSearch(query, result.total, executionMs, result.engine)
                .catch(e => this.logger.error(e));
            if (process.env.SEARCH_DEBUG === 'true' || process.env.NODE_ENV === 'development') {
                this.logger.debug(JSON.stringify({
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
                }, null, 2));
            }
            return response;
        }
        catch (error) {
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
    async autocomplete(q, scholar) {
        const { intentSubject } = this.normalizeIntentQuery(q);
        const effectiveQ = intentSubject && intentSubject.length >= 2 ? intentSubject : q;
        return this.searchRepository.autocomplete(effectiveQ, scholar);
    }
    async getTrendingSearches() {
        return this.searchRepository.getTrendingSearches();
    }
    async getAllSynonyms() {
        return this.searchRepository.getAllSynonyms();
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [search_repository_1.SearchRepository, Object])
], SearchService);
//# sourceMappingURL=search.service.js.map