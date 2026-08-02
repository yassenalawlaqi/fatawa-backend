"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const uthaymeen_importer_1 = require("./uthaymeen.importer");
const prisma_service_1 = require("../../prisma/prisma.service");
const content_extractor_service_1 = require("../services/content-extractor.service");
describe('UthaymeenImporter', () => {
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
                uthaymeen_importer_1.UthaymeenImporter,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: content_extractor_service_1.ContentExtractorService, useValue: mockExtractorService },
            ],
        }).compile();
        importer = module.get(uthaymeen_importer_1.UthaymeenImporter);
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
          <a href="/content/fatwa1">Fatwa 1</a>
          <a href="/content/fatwa2">Fatwa 2</a>
        </body></html>
      `;
            const page2Html = `
        <html><body>
          <a href="/content/fatwa1">Fatwa 1</a>
        </body></html>
      `;
            extractorService.extractContent
                .mockResolvedValueOnce(page1Html)
                .mockResolvedValueOnce(page2Html);
            const items = await importer.fetchRawItems();
            expect(items).toHaveLength(2);
            expect(items[0].url).toBe('https://binothaimeen.net/content/fatwa1');
            expect(items[1].url).toBe('https://binothaimeen.net/content/fatwa2');
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
            const fatwaHtml = `<html><body></body></html>`;
            extractorService.extractContent.mockResolvedValue(fatwaHtml);
            extractorService.extractHtml.mockReturnValue({
                question: 'ما حكم الصيام؟',
                answer: 'الحمد لله الصيام فريضة وركن.',
                rawAnswerHtml: '',
            });
            extractorService.extractAttachments.mockReturnValue([]);
            prismaService.scholar.upsert.mockResolvedValue({ id: 'scholar-2', name: 'العثيمين' });
            prismaService.category.upsert.mockResolvedValue({ id: 'cat-2', name: 'فتاوى عامة' });
            const data = await importer.extractFatwaData({ url: 'https://binothaimeen.net/content/123' });
            expect(data.slug).toBe('uthaymeen-123');
            expect(data.question).toBe('ما حكم الصيام؟');
            expect(data.answer).toBe('الحمد لله الصيام فريضة وركن.');
            expect(data.scholarId).toBe('scholar-2');
            expect(data.categoryId).toBe('cat-2');
            expect(prismaService.scholar.upsert).toHaveBeenCalled();
            expect(prismaService.category.upsert).toHaveBeenCalled();
        });
        it('should throw an error if question or answer is missing', async () => {
            const emptyHtml = `<html><body></body></html>`;
            extractorService.extractContent.mockResolvedValue(emptyHtml);
            extractorService.extractHtml.mockReturnValue({ question: '', answer: '', rawAnswerHtml: '' });
            await expect(importer.extractFatwaData({ url: 'https://binothaimeen.net/content/123' })).rejects.toThrow('Parsing failed for question or answer at https://binothaimeen.net/content/123');
        });
    });
});
//# sourceMappingURL=uthaymeen.importer.spec.js.map