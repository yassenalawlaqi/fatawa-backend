import { Test, TestingModule } from '@nestjs/testing';
import { ImporterService } from './importer.service';
import { getQueueToken } from '@nestjs/bullmq';
import { BinBazImporter } from './plugins/binbaz.importer';
import { UthaymeenImporter } from './plugins/uthaymeen.importer';
import { FawzanImporter } from './plugins/fawzan.importer';
import { PermanentCommitteeImporter } from './plugins/committee.importer';
import { AuditService } from '../system/audit.service';
import { SearchRepository } from '../search/search.repository';
import { Queue } from 'bullmq';

describe('ImporterService', () => {
  let service: ImporterService;
  let importQueue: jest.Mocked<Queue>;
  let binbazImporter: jest.Mocked<BinBazImporter>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const mockQueue = {
      add: jest.fn(),
    };

    const mockBinBazImporter = {
      sourceSlug: 'binbaz-official',
      sourceName: 'BinBaz',
      runImportPipeline: jest.fn(),
    };

    const mockUthaymeenImporter = {
      sourceSlug: 'uthaymeen-official',
      sourceName: 'Uthaymeen',
      runImportPipeline: jest.fn(),
    };

    const mockFawzanImporter = {
      sourceSlug: 'fawzan-official',
      sourceName: 'Fawzan',
      runImportPipeline: jest.fn(),
    };

    const mockCommitteeImporter = {
      sourceSlug: 'committee-official',
      sourceName: 'Committee',
      runImportPipeline: jest.fn(),
    };

    const mockAuditService = {
      logAction: jest.fn(),
    };

    const mockSearchRepository = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImporterService,
        { provide: getQueueToken('import-queue'), useValue: mockQueue },
        { provide: BinBazImporter, useValue: mockBinBazImporter },
        { provide: UthaymeenImporter, useValue: mockUthaymeenImporter },
        { provide: FawzanImporter, useValue: mockFawzanImporter },
        { provide: PermanentCommitteeImporter, useValue: mockCommitteeImporter },
        { provide: AuditService, useValue: mockAuditService },
        { provide: SearchRepository, useValue: mockSearchRepository },
      ],
    }).compile();

    service = module.get<ImporterService>(ImporterService);
    importQueue = module.get(getQueueToken('import-queue'));
    binbazImporter = module.get(BinBazImporter);
    auditService = module.get(AuditService);

    // Disable logging
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scheduleImport', () => {
    it('should schedule import for all sources', async () => {
      const result = await service.scheduleImport('all');
      
      expect(result.success).toBe(true);
      expect(importQueue.add).toHaveBeenCalledTimes(4); // For 4 registered plugins
      expect(importQueue.add).toHaveBeenCalledWith('run-import', { sourceSlug: 'binbaz-official' });
      expect(importQueue.add).toHaveBeenCalledWith('run-import', { sourceSlug: 'uthaymeen-official' });
      expect(importQueue.add).toHaveBeenCalledWith('run-import', { sourceSlug: 'fawzan-official' });
      expect(importQueue.add).toHaveBeenCalledWith('run-import', { sourceSlug: 'committee-official' });
    });

    it('should schedule import for a specific valid source', async () => {
      const result = await service.scheduleImport('binbaz-official');
      
      expect(result.success).toBe(true);
      expect(importQueue.add).toHaveBeenCalledTimes(1);
      expect(importQueue.add).toHaveBeenCalledWith('run-import', { sourceSlug: 'binbaz-official' });
    });

    it('should throw an error for an unknown source', async () => {
      await expect(service.scheduleImport('unknown-source')).rejects.toThrow('Plugin unknown-source not found');
    });
  });

  describe('executeImport', () => {
    it('should execute import pipeline and log action to audit', async () => {
      const mockResult = { processed: 10, new: 5, updated: 5, skipped: 0, failed: 0, errors: [] };
      binbazImporter.runImportPipeline.mockResolvedValue(mockResult);

      const result = await service.executeImport('binbaz-official');

      expect(binbazImporter.runImportPipeline).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalledWith(
        'RUN_IMPORT',
        'ImportLog',
        '00000000-0000-0000-0000-000000000000',
        JSON.stringify(mockResult)
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw an error if plugin not found', async () => {
      await expect(service.executeImport('unknown-source')).rejects.toThrow('Plugin not found for unknown-source');
    });
  });

  describe('handleCron', () => {
    it('should schedule import for all sources', async () => {
      jest.spyOn(service, 'scheduleImport').mockResolvedValue({ success: true, message: '' });
      await service.handleCron();
      expect(service.scheduleImport).toHaveBeenCalledWith('all');
    });

    it('should catch errors if scheduling fails', async () => {
      jest.spyOn(service, 'scheduleImport').mockRejectedValue(new Error('Schedule Error'));
      await service.handleCron(); // Should not throw
      expect(service['logger'].error).toHaveBeenCalledWith('Failed to schedule imports: Schedule Error');
    });
  });
});
