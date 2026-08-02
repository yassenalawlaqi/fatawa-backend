"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const prisma_service_1 = require("../../src/modules/prisma/prisma.service");
const search_repository_1 = require("../../src/modules/search/search.repository");
const keyword_extractor_service_1 = require("../../src/modules/search/keyword-extractor.service");
const synonym_service_1 = require("../../src/modules/search/synonym.service");
const fatawa_repository_1 = require("../../src/modules/fatawa/fatawa.repository");
const cache_manager_1 = require("@nestjs/cache-manager");
describe('Search Engine V1 Features (Integration)', () => {
    let prisma;
    let searchRepo;
    let keywordExtractor;
    let synonymService;
    let fatawaRepo;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [cache_manager_1.CacheModule.register()],
            providers: [
                prisma_service_1.PrismaService,
                search_repository_1.SearchRepository,
                keyword_extractor_service_1.KeywordExtractorService,
                synonym_service_1.SynonymService,
                fatawa_repository_1.FatawaRepository
            ],
        }).compile();
        prisma = moduleFixture.get(prisma_service_1.PrismaService);
        searchRepo = moduleFixture.get(search_repository_1.SearchRepository);
        keywordExtractor = moduleFixture.get(keyword_extractor_service_1.KeywordExtractorService);
        synonymService = moduleFixture.get(synonym_service_1.SynonymService);
        fatawaRepo = moduleFixture.get(fatawa_repository_1.FatawaRepository);
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    it('should extract keywords based on rules', async () => {
        const keywords = await keywordExtractor.extractKeywords({
            question: 'ما حكم الصيام في السفر؟',
            answer: 'يجوز الفطر للمسافر ويقضي',
            categoryName: 'الصيام'
        });
        expect(keywords).toContain('صيام');
        expect(keywords).toContain('الصيام');
    });
    it('should expand synonym query', async () => {
        await prisma.synonym.upsert({
            where: { word_synonym: { word: 'test_الصيام', synonym: 'test_الصوم' } },
            update: {},
            create: { word: 'test_الصيام', synonym: 'test_الصوم' }
        });
        const expanded = await synonymService.expandQuery('test_الصيام');
        expect(expanded).toContain('test_الصيام');
        expect(expanded).toContain('test_الصوم');
    });
    it('should fetch hierarchical categories', async () => {
        const rootCat = await prisma.category.create({
            data: { name: 'Root Category Test', slug: 'root-cat-test-' + Date.now() }
        });
        await prisma.category.create({
            data: { name: 'Child Category Test', slug: 'child-cat-test-' + Date.now(), parentId: rootCat.id }
        });
        const tree = await fatawaRepo.getCategories();
        const foundRoot = tree.find(c => c.id === rootCat.id);
        expect(foundRoot).toBeDefined();
        expect(foundRoot.children).toBeDefined();
        expect(foundRoot.children.length).toBeGreaterThan(0);
        expect(foundRoot.children[0].name).toBe('Child Category Test');
    });
});
//# sourceMappingURL=search-engine-v1.integration.spec.js.map