"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const binbaz_importer_1 = require("./binbaz.importer");
const prisma_service_1 = require("../../prisma/prisma.service");
const content_extractor_service_1 = require("../services/content-extractor.service");
const fatwa_validator_util_1 = require("../utils/fatwa-validator.util");
describe('BinBazImporter', () => {
    let importer;
    let prismaService;
    let extractorService;
    beforeEach(async () => {
        const mockPrismaService = {
            scholar: { upsert: jest.fn() },
            category: { upsert: jest.fn() },
        };
        const mockExtractorService = {
            extractContent: jest.fn(),
            extractHtml: jest.fn(),
            extractAttachments: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                binbaz_importer_1.BinBazImporter,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: content_extractor_service_1.ContentExtractorService, useValue: mockExtractorService },
            ],
        }).compile();
        importer = module.get(binbaz_importer_1.BinBazImporter);
        prismaService = module.get(prisma_service_1.PrismaService);
        extractorService = module.get(content_extractor_service_1.ContentExtractorService);
        jest.spyOn(importer['logger'], 'log').mockImplementation(() => { });
        jest.spyOn(importer['logger'], 'warn').mockImplementation(() => { });
        jest.spyOn(importer['logger'], 'error').mockImplementation(() => { });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(importer).toBeDefined();
    });
    describe('fetchRawItems', () => {
        it('should paginate and extract fatwa URLs from minified HTML fixtures', async () => {
            const page1Html = `
        <html><body>
          <article class="fatwa"><a href="/fatwas/123">Fatwa 123</a></article>
          <article class="fatwa"><a href="/fatwas/456">Fatwa 456</a></article>
        </body></html>
      `;
            const page2Html = `<html><body></body></html>`;
            extractorService.extractContent
                .mockResolvedValueOnce(page1Html)
                .mockResolvedValueOnce(page2Html);
            const items = await importer.fetchRawItems();
            expect(items).toHaveLength(2);
            expect(items[0].url).toBe('https://binbaz.org.sa/fatwas/123');
            expect(items[1].url).toBe('https://binbaz.org.sa/fatwas/456');
            expect(extractorService.extractContent).toHaveBeenCalledTimes(2);
        });
        it('should handle errors during pagination gracefully', async () => {
            extractorService.extractContent.mockRejectedValueOnce(new Error('Network error'));
            const items = await importer.fetchRawItems();
            expect(items).toHaveLength(0);
        });
    });
    describe('extractFatwaData', () => {
        it('should parse fatwa details from minified HTML fixture', async () => {
            const fatwaHtml = `
        <html><body>
          <h2 class="article-title__question">ما حكم الصلاة؟</h2>
          <div class="article-content">الحمد لله الصلاة واجبة.</div>
          <div class="categories__item">فقه العبادات</div>
          <div class="article-date">2023-01-01T00:00:00.000Z</div>
        </body></html>
      `;
            extractorService.extractContent.mockResolvedValue(fatwaHtml);
            extractorService.extractHtml.mockReturnValue({
                question: 'fallback question',
                answer: 'fallback answer',
                rawAnswerHtml: '',
            });
            extractorService.extractAttachments.mockReturnValue([]);
            prismaService.scholar.upsert.mockResolvedValue({ id: 'scholar-1', name: 'Ibn Baz' });
            prismaService.category.upsert.mockResolvedValue({ id: 'cat-1', name: 'فقه العبادات' });
            const data = await importer.extractFatwaData({ url: 'https://binbaz.org.sa/fatwas/789' });
            expect(data.slug).toBe('binbaz-789');
            expect(data.question).toBe('ما حكم الصلاة؟');
            expect(data.answer).toBe('الحمد لله الصلاة واجبة.');
            expect(data.scholarId).toBe('scholar-1');
            expect(data.categoryId).toBe('cat-1');
            expect(data.publishedAt).toBeInstanceOf(Date);
            expect(data.publishedAt.toISOString()).toBe('2023-01-01T00:00:00.000Z');
            expect(prismaService.scholar.upsert).toHaveBeenCalled();
            expect(prismaService.category.upsert).toHaveBeenCalled();
        });
        it('should throw an error if question or answer is missing', async () => {
            const emptyHtml = `<html><body></body></html>`;
            extractorService.extractContent.mockResolvedValue(emptyHtml);
            extractorService.extractHtml.mockReturnValue({ question: '', answer: '', rawAnswerHtml: '' });
            await expect(importer.extractFatwaData({ url: 'https://binbaz.org.sa/fatwas/789' })).rejects.toThrow('Parsing failed for question or answer at https://binbaz.org.sa/fatwas/789');
        });
    });
    describe('Validation & Fingerprint Logic', () => {
        it('Validator should reject empty question or answer', () => {
            const valid = fatwa_validator_util_1.FatwaValidator.validate({ question: 'Q', answer: 'This is a long valid answer', slug: 's', url: 'http://test' });
            const invalidEmpty = fatwa_validator_util_1.FatwaValidator.validate({ question: '', answer: 'This is a long valid answer', slug: 's', url: 'http://test' });
            const invalidShort = fatwa_validator_util_1.FatwaValidator.validate({ question: 'Q', answer: 'Short', slug: 's', url: 'http://test' });
            expect(valid.isValid).toBe(true);
            expect(invalidEmpty.isValid).toBe(false);
            expect(invalidShort.isValid).toBe(false);
        });
        it('should generate identical SHA-256 fingerprints for identical data', () => {
            const hash1 = importer.calculateFingerprint('http://test.com', 'Q1', 'A1');
            const hash2 = importer.calculateFingerprint('http://test.com', 'Q1', 'A1');
            const hash3 = importer.calculateFingerprint('http://test.com', 'Q2', 'A1');
            expect(hash1).toBe(hash2);
            expect(hash1).not.toBe(hash3);
        });
    });
});
//# sourceMappingURL=binbaz.importer.spec.js.map