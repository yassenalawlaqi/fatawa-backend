"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const fawzan_importer_1 = require("./fawzan.importer");
const prisma_service_1 = require("../../prisma/prisma.service");
const content_extractor_service_1 = require("../services/content-extractor.service");
describe('FawzanImporter', () => {
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
                fawzan_importer_1.FawzanImporter,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
                { provide: content_extractor_service_1.ContentExtractorService, useValue: mockExtractorService },
            ],
        }).compile();
        importer = module.get(fawzan_importer_1.FawzanImporter);
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
        it('should paginate starting at 0 and extract fatwa URLs from minified HTML fixtures', async () => {
            const page0Html = `
        <html><body>
          <a href="/node/111">Fatwa 1</a>
          <a href="/node/222">Fatwa 2</a>
        </body></html>
      `;
            const page1Html = `
        <html><body>
          <a href="/node/111">Fatwa 1</a>
        </body></html>
      `;
            extractorService.extractContent
                .mockResolvedValueOnce(page0Html)
                .mockResolvedValueOnce(page1Html);
            const items = await importer.fetchRawItems();
            expect(items).toHaveLength(2);
            expect(items[0].url).toBe('https://alfawzan.af.org.sa/node/111');
            expect(items[1].url).toBe('https://alfawzan.af.org.sa/node/222');
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
          <div class="field-name-field-category"><a href="#">فقه المعاملات</a></div>
        </body></html>
      `;
            extractorService.extractContent.mockResolvedValue(fatwaHtml);
            extractorService.extractHtml.mockReturnValue({
                question: 'ما حكم الربا؟',
                answer: 'الربا حرام شرعاً.',
                rawAnswerHtml: '',
            });
            extractorService.extractAttachments.mockReturnValue([]);
            prismaService.scholar.upsert.mockResolvedValue({ id: 'scholar-3', name: 'الفوزان' });
            prismaService.category.upsert.mockResolvedValue({ id: 'cat-3', name: 'فقه المعاملات' });
            const data = await importer.extractFatwaData({ url: 'https://alfawzan.af.org.sa/node/999' });
            expect(data.slug).toBe('fawzan-999');
            expect(data.question).toBe('ما حكم الربا؟');
            expect(data.answer).toBe('الربا حرام شرعاً.');
            expect(data.scholarId).toBe('scholar-3');
            expect(data.categoryId).toBe('cat-3');
            expect(prismaService.scholar.upsert).toHaveBeenCalled();
            expect(prismaService.category.upsert).toHaveBeenCalled();
        });
        it('should throw an error if question or answer is missing', async () => {
            const emptyHtml = `<html><body></body></html>`;
            extractorService.extractContent.mockResolvedValue(emptyHtml);
            extractorService.extractHtml.mockReturnValue({ question: '', answer: '', rawAnswerHtml: '' });
            await expect(importer.extractFatwaData({ url: 'https://alfawzan.af.org.sa/node/999' })).rejects.toThrow('Parsing failed for question or answer at https://alfawzan.af.org.sa/node/999');
        });
    });
});
//# sourceMappingURL=fawzan.importer.spec.js.map