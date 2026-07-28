import { Test, TestingModule } from '@nestjs/testing';
import { ImporterProcessor } from './importer.processor';
import { ImporterService } from './importer.service';
import { Job } from 'bullmq';

describe('ImporterProcessor', () => {
  let processor: ImporterProcessor;
  let importerService: jest.Mocked<ImporterService>;

  beforeEach(async () => {
    const mockImporterService = {
      executeImport: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImporterProcessor,
        { provide: ImporterService, useValue: mockImporterService },
      ],
    }).compile();

    processor = module.get<ImporterProcessor>(ImporterProcessor);
    importerService = module.get(ImporterService);
    
    // Disable logging
    jest.spyOn(processor['logger'], 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  it('should process run-import job and call executeImport', async () => {
    const mockJob = {
      id: 'job-1',
      name: 'run-import',
      data: { sourceSlug: 'test-source' },
    } as unknown as Job;

    importerService.executeImport.mockResolvedValue('success');

    const result = await processor.process(mockJob);

    expect(importerService.executeImport).toHaveBeenCalledWith('test-source');
    expect(result).toBe('success');
  });

  it('should ignore jobs with unknown names', async () => {
    const mockJob = {
      id: 'job-2',
      name: 'unknown-job',
      data: {},
    } as unknown as Job;

    const result = await processor.process(mockJob);

    expect(importerService.executeImport).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
