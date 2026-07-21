import { Test, TestingModule } from '@nestjs/testing';
import { BinBazImporter } from './binbaz.importer';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentExtractorService } from '../services/content-extractor.service';
import { FatwaValidator } from '../utils/fatwa-validator.util';

describe('BinBazImporter - Reference Architecture', () => {
  let importer: BinBazImporter;
  let prismaService: PrismaService;
  let extractor: ContentExtractorService;

  beforeEach(async () => {
    const mockPrismaService = {
      source: { upsert: jest.fn().mockResolvedValue({ id: 'source-id' }) },
      scholar: { upsert: jest.fn().mockResolvedValue({ id: 'scholar-id' }) },
      category: { upsert: jest.fn().mockResolvedValue({ id: 'category-id' }) },
      fatwa: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'fatwa-id' }),
        update: jest.fn().mockResolvedValue({ id: 'fatwa-id' }),
      },
      fatwaRevision: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'rev-id' }),
      },
      $transaction: jest.fn((cb) => cb(mockPrismaService)),
    };

    const mockContentExtractor = {
      extractContent: jest.fn(),
      extractHtml: jest.fn().mockReturnValue({
        question: 'حكم صلاة الوتر',
        answer: 'صلاة الوتر سنة مؤكدة. والله أعلم.',
        rawAnswerHtml: '<p>صلاة الوتر سنة مؤكدة. والله أعلم.</p>'
      }),
      extractAttachments: jest.fn().mockReturnValue([{ type: 'pdf', url: 'http://test.pdf', title: 'ملف PDF' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BinBazImporter,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ContentExtractorService, useValue: mockContentExtractor },
      ],
    }).compile();

    importer = module.get<BinBazImporter>(BinBazImporter);
    prismaService = module.get<PrismaService>(PrismaService);
    extractor = module.get<ContentExtractorService>(ContentExtractorService);
  });

  it('should be defined', () => {
    expect(importer).toBeDefined();
  });

  describe('extractFatwaData', () => {
    it('should correctly extract clean text and attachments using the Reference Architecture', async () => {
      const mockHtml = `<html><body><h1 class="article-title">حكم صلاة الوتر</h1><div class="article-content"><p>صلاة الوتر سنة مؤكدة. والله أعلم.</p><a href="file.pdf">ملف PDF</a></div><div class="article-date">2026-07-19</div></body></html>`;

      const result = await importer.extractFatwaData({ url: 'https://binbaz.org.sa/fatwas/999/test', html: mockHtml });

      expect(result.slug).toBe('binbaz-999');
      expect(result.question).toBe('حكم صلاة الوتر');
      expect(result.answer).toContain('صلاة الوتر سنة مؤكدة');
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0].url).toBe('http://test.pdf');
    });
  });

  describe('Validation & Fingerprint Logic (BaseImporterService)', () => {
    it('Validator should reject empty question or answer', () => {
      const valid = FatwaValidator.validate({ question: 'Q', answer: 'This is a long valid answer', slug: 's', url: 'http://test' });
      const invalidEmpty = FatwaValidator.validate({ question: '', answer: 'This is a long valid answer', slug: 's', url: 'http://test' });
      const invalidShort = FatwaValidator.validate({ question: 'Q', answer: 'Short', slug: 's', url: 'http://test' });

      expect(valid.isValid).toBe(true);
      expect(invalidEmpty.isValid).toBe(false);
      expect(invalidShort.isValid).toBe(false);
    });

    it('should generate identical SHA-256 fingerprints for identical data', () => {
      // @ts-ignore - access protected method for testing
      const hash1 = importer.calculateFingerprint('http://test.com', 'Q1', 'A1');
      // @ts-ignore
      const hash2 = importer.calculateFingerprint('http://test.com', 'Q1', 'A1');
      // @ts-ignore
      const hash3 = importer.calculateFingerprint('http://test.com', 'Q2', 'A1');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });
  });
});
