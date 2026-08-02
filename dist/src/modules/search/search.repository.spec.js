"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const search_repository_1 = require("./search.repository");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
describe('SearchRepository', () => {
    let repository;
    let prismaService;
    beforeEach(async () => {
        const mockPrismaService = {
            $executeRawUnsafe: jest.fn(),
            $queryRaw: jest.fn(),
            searchLog: {
                create: jest.fn(),
                groupBy: jest.fn(),
            },
            fatwa: {
                findMany: jest.fn(),
            },
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                search_repository_1.SearchRepository,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        repository = module.get(search_repository_1.SearchRepository);
        prismaService = module.get(prisma_service_1.PrismaService);
        jest.spyOn(common_1.Logger.prototype, 'error').mockImplementation(() => { });
        jest.spyOn(common_1.Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(common_1.Logger.prototype, 'warn').mockImplementation(() => { });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(repository).toBeDefined();
    });
    describe('rebuildSearchIndex', () => {
        it('should execute raw queries to rebuild the index', async () => {
            prismaService.$executeRawUnsafe.mockResolvedValue(1);
            await repository.rebuildSearchIndex();
            expect(prismaService.$executeRawUnsafe).toHaveBeenCalledTimes(2);
        });
        it('should not throw if rebuilding fails but log error', async () => {
            prismaService.$executeRawUnsafe.mockRejectedValue(new Error('DB Error'));
            await expect(repository.rebuildSearchIndex()).resolves.not.toThrow();
        });
    });
    describe('search', () => {
        it('should use FTS if it returns results', async () => {
            jest.spyOn(repository, 'searchFTS').mockResolvedValue({ data: [{ id: '1' }], total: 1 });
            jest.spyOn(repository, 'searchFallback');
            const result = await repository.search('الصلاة', 1, 10);
            expect(repository.searchFTS).toHaveBeenCalledWith('الصلاة', 1, 10);
            expect(repository.searchFallback).not.toHaveBeenCalled();
            expect(result.engine).toBe('fts');
        });
        it('should fallback if FTS returns 0 results', async () => {
            jest.spyOn(repository, 'searchFTS').mockResolvedValue({ data: [], total: 0 });
            jest.spyOn(repository, 'searchFallback').mockResolvedValue({ data: [{ id: '1' }], total: 1 });
            const result = await repository.search('الصلاة', 1, 10);
            expect(repository.searchFallback).toHaveBeenCalledWith('الصلاة', 1, 10);
            expect(result.engine).toBe('fallback');
        });
        it('should fallback if FTS throws error', async () => {
            jest.spyOn(repository, 'searchFTS').mockRejectedValue(new Error('Syntax Error'));
            jest.spyOn(repository, 'searchFallback').mockResolvedValue({ data: [{ id: '1' }], total: 1 });
            const result = await repository.search('الصلاة', 1, 10);
            expect(repository.searchFallback).toHaveBeenCalledWith('الصلاة', 1, 10);
            expect(result.engine).toBe('fallback');
        });
    });
    describe('searchFTS', () => {
        it('should call $queryRaw for FTS search', async () => {
            prismaService.$queryRaw.mockImplementation(async (query) => {
                if (query.strings[0].includes('COUNT'))
                    return [{ total: 1 }];
                return [{ id: '1', question: 'كيف أصلي' }];
            });
            const result = await repository.searchFTS('الصلاة', 1, 10);
            expect(prismaService.$queryRaw).toHaveBeenCalledTimes(2);
            expect(result.total).toBe(1);
        });
    });
    describe('searchFallback', () => {
        it('should return empty array if query has no valid terms', async () => {
            const result = await repository.searchFallback('ص', 1, 10);
            expect(result.data).toEqual([]);
            expect(result.total).toBe(0);
            expect(prismaService.fatwa.findMany).not.toHaveBeenCalled();
        });
        it('should execute Prisma query and manually score the results', async () => {
            const mockFatawa = [
                {
                    id: '1', slug: 'f1',
                    question: 'ما حكم الصلاة؟', answer: 'تجب الصلاة...',
                    scholar: { name: 'ابن باز' }, category: { name: 'الصلاة' }, source: { name: 'الموقع' }
                },
                {
                    id: '2', slug: 'f2',
                    question: 'شروط الصلاة', answer: 'شروط...',
                    scholar: { name: 'عثيمين' }, category: { name: 'فقه' }, source: { name: 'الموقع' }
                }
            ];
            prismaService.fatwa.findMany.mockResolvedValue(mockFatawa);
            const result = await repository.searchFallback('الصلاة', 1, 10);
            expect(prismaService.fatwa.findMany).toHaveBeenCalled();
            expect(result.total).toBe(2);
            expect(result.data[0].id).toBe('1');
            expect(result.data[0].score).toBeGreaterThan(result.data[1].score);
            expect(result.data[0].questionTitle).toBe('ما حكم الصلاة؟...');
        });
        it('should throw and log if DB query fails', async () => {
            prismaService.fatwa.findMany.mockRejectedValue(new Error('Fallback DB Error'));
            await expect(repository.searchFallback('الصلاة', 1, 10)).rejects.toThrow('Fallback DB Error');
        });
    });
    describe('autocomplete', () => {
        it('should query Prisma and build suggestions set', async () => {
            prismaService.fatwa.findMany.mockResolvedValue([
                { question: 'هل صيام كذا صحيح', scholar: { name: 'ابن باز' }, category: { name: 'الصيام' } }
            ]);
            const result = await repository.autocomplete('صيام');
            expect(result.length).toBeGreaterThan(0);
            expect(prismaService.fatwa.findMany).toHaveBeenCalled();
        });
    });
    describe('logSearch', () => {
        it('should create log', async () => {
            prismaService.searchLog.create.mockResolvedValue({});
            await repository.logSearch('الصلاة', 10, 50, 'fts');
            expect(prismaService.searchLog.create).toHaveBeenCalled();
        });
    });
    describe('getTrendingSearches', () => {
        it('should fetch grouped queries', async () => {
            prismaService.searchLog.groupBy.mockResolvedValue([{ query: 'الصلاة' }]);
            const result = await repository.getTrendingSearches();
            expect(result).toEqual(['الصلاة']);
        });
    });
});
//# sourceMappingURL=search.repository.spec.js.map