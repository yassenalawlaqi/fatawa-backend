import { Test, TestingModule } from '@nestjs/testing';
import { PermanentCommitteeImporter } from './committee.importer';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentExtractorService } from '../services/content-extractor.service';

describe('PermanentCommitteeImporter', () => {
  let importer: PermanentCommitteeImporter;
  let prismaService: jest.Mocked<PrismaService>;
  let extractorService: jest.Mocked<ContentExtractorService>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermanentCommitteeImporter,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ContentExtractorService, useValue: mockExtractorService },
      ],
    }).compile();

    importer = module.get<PermanentCommitteeImporter>(PermanentCommitteeImporter);
    prismaService = module.get(PrismaService);
    extractorService = module.get(ContentExtractorService);
    
    // Disable logging
    jest.spyOn(importer['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(importer['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(importer['logger'], 'error').mockImplementation(() => {});
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
          <a href="/Fatwa/111">Fatwa 1</a>
          <a href="/Fatwa/222">Fatwa 2</a>
        </body></html>
      `;
      const page2Html = `
        <html><body>
          <a href="/Fatwa/111">Fatwa 1</a>
        </body></html>
      `;

      extractorService.extractContent
        .mockResolvedValueOnce(page1Html)
        .mockResolvedValueOnce(page2Html); // Duplicate link will stop pagination

      const items = await importer.fetchRawItems();

      expect(items).toHaveLength(2);
      expect(items[0].url).toBe('https://alifta.gov.sa/Fatwa/111');
      expect(items[1].url).toBe('https://alifta.gov.sa/Fatwa/222');
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
        question: 'ما حكم الزكاة؟',
        answer: 'الزكاة ركن من أركان الإسلام.',
        rawAnswerHtml: '',
      });
      extractorService.extractAttachments.mockReturnValue([]);

      prismaService.scholar.upsert.mockResolvedValue({ id: 'scholar-4', name: 'اللجنة الدائمة' } as any);
      prismaService.category.upsert.mockResolvedValue({ id: 'cat-4', name: 'فتاوى عامة' } as any);

      const data = await importer.extractFatwaData({ url: 'https://alifta.gov.sa/Fatwa/999' });

      expect(data.slug).toBe('committee-999');
      expect(data.question).toBe('ما حكم الزكاة؟');
      expect(data.answer).toBe('الزكاة ركن من أركان الإسلام.');
      expect(data.scholarId).toBe('scholar-4');
      expect(data.categoryId).toBe('cat-4');
      expect(prismaService.scholar.upsert).toHaveBeenCalled();
      expect(prismaService.category.upsert).toHaveBeenCalled();
    });

    it('should throw an error if question or answer is missing', async () => {
      const emptyHtml = `<html><body></body></html>`;
      extractorService.extractContent.mockResolvedValue(emptyHtml);
      extractorService.extractHtml.mockReturnValue({ question: '', answer: '', rawAnswerHtml: '' });

      await expect(
        importer.extractFatwaData({ url: 'https://alifta.gov.sa/Fatwa/999' })
      ).rejects.toThrow('Parsing failed for question or answer at https://alifta.gov.sa/Fatwa/999');
    });
  });
});
