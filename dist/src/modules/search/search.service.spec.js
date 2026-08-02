"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const search_service_1 = require("./search.service");
const search_repository_1 = require("./search.repository");
const cache_manager_1 = require("@nestjs/cache-manager");
describe('SearchService', () => {
    let service;
    let repository;
    let cacheManager;
    beforeEach(async () => {
        const mockSearchRepo = {
            search: jest.fn(),
            autocomplete: jest.fn(),
            logSearch: jest.fn(),
            getTrendingSearches: jest.fn(),
        };
        const mockCacheManager = {
            get: jest.fn(),
            set: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                search_service_1.SearchService,
                { provide: search_repository_1.SearchRepository, useValue: mockSearchRepo },
                { provide: cache_manager_1.CACHE_MANAGER, useValue: mockCacheManager },
            ],
        }).compile();
        service = module.get(search_service_1.SearchService);
        repository = module.get(search_repository_1.SearchRepository);
        cacheManager = module.get(cache_manager_1.CACHE_MANAGER);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('search', () => {
        it('should return cached result if cache hit', async () => {
            const dto = { q: 'الصلاة', page: 1, limit: 10 };
            const cachedResponse = { data: [], pagination: { total: 0 }, meta: { cached: true }, total: 0 };
            cacheManager.get.mockResolvedValue(cachedResponse);
            repository.logSearch.mockResolvedValue(undefined);
            const result = await service.search(dto);
            expect(cacheManager.get).toHaveBeenCalledWith('search:الصلاة:1:10');
            expect(repository.search).not.toHaveBeenCalled();
            expect(result).toEqual(cachedResponse);
        });
        it('should fetch from DB, set cache, and log search if cache miss', async () => {
            const dto = { q: 'الزكاة', page: 1, limit: 10 };
            cacheManager.get.mockResolvedValue(null);
            const dbResult = { data: [{ id: '1' }], total: 1, engine: 'fts' };
            repository.search.mockResolvedValue(dbResult);
            repository.logSearch.mockResolvedValue(undefined);
            cacheManager.set.mockResolvedValue(undefined);
            const result = await service.search(dto);
            expect(repository.search).toHaveBeenCalledWith('الزكاة', 1, 10);
            expect(cacheManager.set).toHaveBeenCalled();
            expect(repository.logSearch).toHaveBeenCalledWith('الزكاة', 1, expect.any(Number), 'fts');
            expect(result.success).toBe(true);
            expect(result.data.length).toBe(1);
        });
    });
    describe('autocomplete', () => {
        it('should return empty suggestions if query is too short', async () => {
            const result = await service.autocomplete('ص');
            expect(result).toEqual({ suggestions: [] });
        });
        it('should return suggestions from DB if cache miss', async () => {
            cacheManager.get.mockResolvedValue(null);
            repository.autocomplete.mockResolvedValue(['suggestion1', 'suggestion2']);
            const result = await service.autocomplete('صيام');
            expect(repository.autocomplete).toHaveBeenCalledWith('صيام');
            expect(result).toEqual({ suggestions: ['suggestion1', 'suggestion2'] });
        });
    });
    describe('getTrendingSearches', () => {
        it('should fetch trending searches from repository', async () => {
            cacheManager.get.mockResolvedValue(null);
            repository.getTrendingSearches.mockResolvedValue(['الصلاة', 'الزكاة']);
            const result = await service.getTrendingSearches();
            expect(result.trending).toEqual(['الصلاة', 'الزكاة']);
        });
    });
});
//# sourceMappingURL=search.service.spec.js.map