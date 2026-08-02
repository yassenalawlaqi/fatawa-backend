"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const importer_processor_1 = require("./importer.processor");
const importer_service_1 = require("./importer.service");
describe('ImporterProcessor', () => {
    let processor;
    let importerService;
    beforeEach(async () => {
        const mockImporterService = {
            executeImport: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                importer_processor_1.ImporterProcessor,
                { provide: importer_service_1.ImporterService, useValue: mockImporterService },
            ],
        }).compile();
        processor = module.get(importer_processor_1.ImporterProcessor);
        importerService = module.get(importer_service_1.ImporterService);
        jest.spyOn(processor['logger'], 'log').mockImplementation(() => { });
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
        };
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
        };
        const result = await processor.process(mockJob);
        expect(importerService.executeImport).not.toHaveBeenCalled();
        expect(result).toBeUndefined();
    });
});
//# sourceMappingURL=importer.processor.spec.js.map