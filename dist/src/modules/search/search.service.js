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
let SearchService = SearchService_1 = class SearchService {
    searchRepository;
    cacheManager;
    logger = new common_1.Logger(SearchService_1.name);
    constructor(searchRepository, cacheManager) {
        this.searchRepository = searchRepository;
        this.cacheManager = cacheManager;
    }
    async search(queryDto) {
        const { scholar, category, limit = 20 } = queryDto;
        const page = Math.max(1, parseInt(queryDto.page, 10) || 1);
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
                    return cachedResult;
                }
            }
            catch (cacheError) {
                this.logger.warn(`Cache retrieval failed, proceeding to DB: ${cacheError.message}`);
            }
            const result = await this.searchRepository.search(query, parseInt(page, 10), parseInt(limit, 10));
            const executionMs = Date.now() - startTime;
            const totalPages = Math.ceil(result.total / limit);
            this.logger.log('Response Mapping Started');
            const response = {
                success: true,
                message: 'تم البحث بنجاح',
                data: result.data,
                pagination: {
                    page: parseInt(page, 10),
                    limit: parseInt(limit, 10),
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
        }
        catch (error) {
            this.logger.error(`Exception Name: ${error.name}`);
            this.logger.error(`Message: ${error.message}`);
            this.logger.error(`Stack: ${error.stack}`);
            throw error;
        }
    }
    async autocomplete(q) {
        if (!q || q.length < 2)
            return { suggestions: [] };
        const cacheKey = `autocomplete:${q}`;
        try {
            const cached = await this.cacheManager.get(cacheKey);
            if (cached)
                return cached;
        }
        catch (e) { }
        const suggestions = await this.searchRepository.autocomplete(q);
        const result = { suggestions };
        try {
            await this.cacheManager.set(cacheKey, result, 300000);
        }
        catch (e) { }
        return result;
    }
    async getTrendingSearches() {
        const cacheKey = 'trending:searches';
        try {
            const cached = await this.cacheManager.get(cacheKey);
            if (cached)
                return cached;
        }
        catch (e) { }
        const trending = await this.searchRepository.getTrendingSearches();
        const result = { trending };
        try {
            await this.cacheManager.set(cacheKey, result, 600000);
        }
        catch (e) { }
        return result;
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [search_repository_1.SearchRepository, Object])
], SearchService);
//# sourceMappingURL=search.service.js.map