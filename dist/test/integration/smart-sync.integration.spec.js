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
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const base_importer_service_1 = require("../../src/modules/importer/services/base-importer.service");
const prisma_service_1 = require("../../src/modules/prisma/prisma.service");
const test_db_util_1 = require("../utils/test-db.util");
const common_1 = require("@nestjs/common");
let TestSmartSyncImporter = class TestSmartSyncImporter extends base_importer_service_1.BaseImporterService {
    sourceName = 'Integration Test Source';
    sourceSlug = 'integration-test';
    testItems = [];
    extractLogic = async () => ({});
    constructor(prisma) {
        super(prisma);
    }
    async fetchRawItems() {
        return this.testItems;
    }
    async extractFatwaData(rawItem) {
        return this.extractLogic(rawItem);
    }
};
TestSmartSyncImporter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TestSmartSyncImporter);
describe('Smart Sync Integration Tests', () => {
    let importer;
    let prisma;
    beforeAll(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                TestSmartSyncImporter,
                prisma_service_1.PrismaService,
            ],
        }).compile();
        importer = module.get(TestSmartSyncImporter);
        prisma = module.get(prisma_service_1.PrismaService);
        jest.spyOn(importer['logger'], 'log').mockImplementation(() => { });
        jest.spyOn(importer['logger'], 'warn').mockImplementation(() => { });
        jest.spyOn(importer['logger'], 'error').mockImplementation(() => { });
    });
    beforeEach(async () => {
        await test_db_util_1.TestDbUtil.wipeDatabase();
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    it('should insert a new fatwa and update the search index (New)', async () => {
        const scholar = await prisma.scholar.create({ data: { name: 'Test Scholar', slug: 'test-scholar' } });
        const category = await prisma.category.create({ data: { name: 'Test Category', slug: 'test-category' } });
        importer.testItems = [{ id: 1 }];
        importer.extractLogic = async () => ({
            slug: 'test-fatwa-1',
            question: 'السؤال عن الصلاة',
            answer: 'الصلاة واجبة وهي عماد الدين',
            url: 'http://test.com/1',
            scholarId: scholar.id,
            categoryId: category.id,
            publishedAt: new Date(),
        });
        const result = await importer.runImportPipeline();
        expect(result.new).toBe(1);
        expect(result.updated).toBe(0);
        expect(result.skipped).toBe(0);
        const fatwas = await prisma.fatwa.findMany();
        expect(fatwas.length).toBe(1);
        expect(fatwas[0].slug).toBe('test-fatwa-1');
        expect(fatwas[0].hash).toBeDefined();
        const searchDocs = await prisma.$queryRaw `SELECT * FROM search_index WHERE fatwa_id = ${fatwas[0].id}`;
        expect(searchDocs.length).toBe(1);
        expect(searchDocs[0].question).toBe('السؤال عن الصلاة');
    });
    it('should skip duplicate fatwas with the same fingerprint (Skipped)', async () => {
        const scholar = await prisma.scholar.create({ data: { name: 'Test Scholar', slug: 'test-scholar' } });
        const category = await prisma.category.create({ data: { name: 'Test Category', slug: 'test-category' } });
        importer.testItems = [{ id: 1 }];
        importer.extractLogic = async () => ({
            slug: 'test-fatwa-2',
            question: 'السؤال عن الزكاة',
            answer: 'الزكاة ركن من أركان الإسلام',
            url: 'http://test.com/2',
            scholarId: scholar.id,
            categoryId: category.id,
            publishedAt: new Date(),
        });
        await importer.runImportPipeline();
        const result2 = await importer.runImportPipeline();
        expect(result2.new).toBe(0);
        expect(result2.updated).toBe(0);
        expect(result2.skipped).toBe(1);
        const fatwas = await prisma.fatwa.findMany();
        expect(fatwas.length).toBe(1);
        const searchDocs = await prisma.$queryRaw `SELECT * FROM search_index`;
        expect(searchDocs.length).toBe(1);
    });
    it('should update fatwa and create revision if fingerprint changes (Updated)', async () => {
        const scholar = await prisma.scholar.create({ data: { name: 'Test Scholar', slug: 'test-scholar' } });
        const category = await prisma.category.create({ data: { name: 'Test Category', slug: 'test-category' } });
        importer.testItems = [{ id: 1 }];
        importer.extractLogic = async () => ({
            slug: 'test-fatwa-3',
            question: 'السؤال عن الحج',
            answer: 'الحج مرة في العمر',
            url: 'http://test.com/3',
            scholarId: scholar.id,
            categoryId: category.id,
            publishedAt: new Date(),
        });
        await importer.runImportPipeline();
        importer.extractLogic = async () => ({
            slug: 'test-fatwa-3',
            question: 'السؤال عن الحج',
            answer: 'الحج مرة في العمر لمن استطاع إليه سبيلا (محدث)',
            url: 'http://test.com/3',
            scholarId: scholar.id,
            categoryId: category.id,
            publishedAt: new Date(),
        });
        const result2 = await importer.runImportPipeline();
        expect(result2.new).toBe(0);
        expect(result2.updated).toBe(1);
        expect(result2.skipped).toBe(0);
        const fatwas = await prisma.fatwa.findMany({ where: { slug: 'test-fatwa-3' } });
        expect(fatwas.length).toBe(1);
        expect(fatwas[0].answer).toContain('(محدث)');
        const searchDocs = await prisma.$queryRaw `SELECT * FROM search_index WHERE fatwa_id = ${fatwas[0].id}`;
        expect(searchDocs[0].answer).toContain('(محدث)');
        const revisionsCount = await prisma.fatwaRevision.count({ where: { fatwaId: fatwas[0].id } });
        expect(revisionsCount).toBe(1);
    });
});
//# sourceMappingURL=smart-sync.integration.spec.js.map