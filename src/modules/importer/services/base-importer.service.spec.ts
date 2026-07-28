import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, Logger } from '@nestjs/common';
import { BaseImporterService } from './base-importer.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FatwaData } from '../interfaces/i-importer.interface';

@Injectable()
class TestImporter extends BaseImporterService {
  sourceName = 'Test Source';
  sourceSlug = 'test-source';
  officialUrl = 'https://test.com';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async fetchRawItems(): Promise<any[]> {
    return [];
  }

  async extractFatwaData(rawItem: any): Promise<FatwaData> {
    return rawItem as FatwaData;
  }
}

describe('BaseImporterService', () => {
  let service: TestImporter;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      source: { upsert: jest.fn() },
      fatwa: { 
        findUnique: jest.fn(), 
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      fatwaRevision: {
        count: jest.fn(),
        create: jest.fn(),
      },
      importJob: { create: jest.fn() },
      syncStatus: { upsert: jest.fn() },
      $transaction: jest.fn(async (cb) => {
        // Execute the transaction callback directly
        return await cb(mockPrismaService);
      }),
      $executeRawUnsafe: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestImporter,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TestImporter>(TestImporter);
    prismaService = module.get(PrismaService);

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation((msg, stack) => {
      console.error('LOGGER ERROR:', msg, stack);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runImportPipeline', () => {
    beforeEach(() => {
      prismaService.source.upsert.mockResolvedValue({ id: 'src-1' } as any);
      prismaService.importJob.create.mockResolvedValue({} as any);
      prismaService.syncStatus.upsert.mockResolvedValue({} as any);
      prismaService.fatwa.updateMany.mockResolvedValue({ count: 0 });
    });

    it('should handle a successful pipeline with no items', async () => {
      jest.spyOn(service, 'fetchRawItems').mockResolvedValue([]);

      const result = await service.runImportPipeline();

      expect(result.status).toBe('success');
      expect(result.imported).toBe(0);
      expect(prismaService.source.upsert).toHaveBeenCalled();
      expect(prismaService.$executeRawUnsafe).not.toHaveBeenCalled(); // No items = no index update
    });

    it('should import new fatwa', async () => {
      jest.spyOn(service, 'fetchRawItems').mockResolvedValue([{ 
        slug: 'test-fatwa-1', question: 'سؤال طويل جدا', answer: 'هذا هو الجواب الطويل والمفصل', url: 'https://test.com/1' 
      }]);
      
      prismaService.fatwa.findUnique.mockResolvedValue(null);
      prismaService.fatwa.create.mockResolvedValue({ id: 'fatwa-1' } as any);

      const result = await service.runImportPipeline();

      expect(result.status).toBe('success');
      expect(result.imported).toBe(1);
      expect(prismaService.fatwa.create).toHaveBeenCalled();
      expect(prismaService.$executeRawUnsafe).toHaveBeenCalledTimes(2); // Search index rebuilds
    });

    it('should skip invalid fatwa', async () => {
      jest.spyOn(service, 'fetchRawItems').mockResolvedValue([{ 
        slug: 'test-fatwa-2', question: '', answer: '', url: 'https://test.com/2' 
      }]); // Missing required fields

      const result = await service.runImportPipeline();

      expect(result.status).toBe('success');
      expect(result.skipped).toBe(1);
      expect(prismaService.fatwa.create).not.toHaveBeenCalled();
    });

    it('should detect duplicate fatwa without updating', async () => {
      const item = { slug: 'test-fatwa-3', question: 'سؤال طويل جدا', answer: 'هذا هو الجواب الطويل والمفصل', url: 'https://test.com/3' };
      jest.spyOn(service, 'fetchRawItems').mockResolvedValue([item]);
      
      const expectedFingerprint = (service as any).calculateFingerprint(item.url, item.question, item.answer);
      
      prismaService.fatwa.findUnique.mockResolvedValue({ 
        id: 'fatwa-3', 
        sourceFingerprint: expectedFingerprint 
      } as any);

      const result = await service.runImportPipeline();

      expect(result.status).toBe('success');
      expect(result.duplicated).toBe(1);
      expect(prismaService.fatwa.update).not.toHaveBeenCalled();
    });

    it('should update existing fatwa and create revision if fingerprint changes', async () => {
      const item = { slug: 'test-fatwa-4', question: 'سؤال طويل جدا جديد', answer: 'هذا هو الجواب الطويل والمفصل الجديد', url: 'https://test.com/4' };
      jest.spyOn(service, 'fetchRawItems').mockResolvedValue([item]);
      
      prismaService.fatwa.findUnique.mockResolvedValue({ 
        id: 'fatwa-4', 
        sourceFingerprint: 'old-fingerprint' 
      } as any);
      
      prismaService.fatwaRevision.count.mockResolvedValue(0);

      const result = await service.runImportPipeline();

      expect(result.status).toBe('success');
      expect(result.updated).toBe(1);
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(prismaService.fatwaRevision.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ fatwaId: 'fatwa-4', revisionNumber: 1 })
      }));
      expect(prismaService.fatwa.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'fatwa-4' }
      }));
    });

    it('should log failed items without failing the entire pipeline', async () => {
      jest.spyOn(service, 'fetchRawItems').mockResolvedValue([{ slug: 'test-5' }, { slug: 'test-6' }]);
      
      jest.spyOn(service, 'extractFatwaData')
        .mockRejectedValueOnce(new Error('Extract error')) // 1st fails
        .mockResolvedValueOnce({ slug: 'test-6', question: 'سؤال طويل جدا', answer: 'هذا هو الجواب الطويل والمفصل', url: 'https://test.com/6' } as any); // 2nd succeeds
      
      prismaService.fatwa.findUnique.mockResolvedValue(null);

      const result = await service.runImportPipeline();

      expect(result.status).toBe('success'); // Overall success because at least one could process or it finished the loop
      expect(result.failed).toBe(1);
      expect(result.imported).toBe(1);
    });

    it('should catch critical pipeline failures and update status to error', async () => {
      jest.spyOn(service, 'fetchRawItems').mockRejectedValue(new Error('Network Down'));

      const result = await service.runImportPipeline();

      expect(result.status).toBe('failed');
      expect(result.failed).toBe(1);
      expect(prismaService.importJob.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'failed' })
      }));
      expect(prismaService.syncStatus.upsert).toHaveBeenCalledWith(expect.objectContaining({
        update: expect.objectContaining({ status: 'error' })
      }));
    });
  });
});
