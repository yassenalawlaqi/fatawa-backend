"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const importer_service_1 = require("./importer.service");
const bullmq_1 = require("@nestjs/bullmq");
const binbaz_importer_1 = require("./plugins/binbaz.importer");
const uthaymeen_importer_1 = require("./plugins/uthaymeen.importer");
const fawzan_importer_1 = require("./plugins/fawzan.importer");
const committee_importer_1 = require("./plugins/committee.importer");
const audit_service_1 = require("../system/audit.service");
const search_repository_1 = require("../search/search.repository");
describe('ImporterService', () => {
    let service;
    let importQueue;
    let binbazImporter;
    let auditService;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                importer_service_1.ImporterService,
                { provide: (0, bullmq_1.getQueueToken)('import-queue'), useValue: mockQueue },
                { provide: binbaz_importer_1.BinBazImporter, useValue: mockBinBazImporter },
                { provide: uthaymeen_importer_1.UthaymeenImporter, useValue: mockUthaymeenImporter },
                { provide: fawzan_importer_1.FawzanImporter, useValue: mockFawzanImporter },
                { provide: committee_importer_1.PermanentCommitteeImporter, useValue: mockCommitteeImporter },
                { provide: audit_service_1.AuditService, useValue: mockAuditService },
                { provide: search_repository_1.SearchRepository, useValue: mockSearchRepository },
            ],
        }).compile();
        service = module.get(importer_service_1.ImporterService);
        importQueue = module.get((0, bullmq_1.getQueueToken)('import-queue'));
        binbazImporter = module.get(binbaz_importer_1.BinBazImporter);
        auditService = module.get(audit_service_1.AuditService);
        jest.spyOn(service['logger'], 'log').mockImplementation(() => { });
        jest.spyOn(service['logger'], 'error').mockImplementation(() => { });
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
            expect(importQueue.add).toHaveBeenCalledTimes(4);
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
            expect(auditService.logAction).toHaveBeenCalledWith('RUN_IMPORT', 'ImportLog', '00000000-0000-0000-0000-000000000000', JSON.stringify(mockResult));
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
            await service.handleCron();
            expect(service['logger'].error).toHaveBeenCalledWith('Failed to schedule imports: Schedule Error');
        });
    });
});
//# sourceMappingURL=importer.service.spec.js.map