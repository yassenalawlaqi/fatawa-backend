"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const base_importer_service_1 = require("./base-importer.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let TestImporter = class TestImporter extends base_importer_service_1.BaseImporterService {
    sourceName = 'Test Source';
    sourceSlug = 'test-source';
    officialUrl = 'https://test.com';
    constructor(prisma) {
        super(prisma);
    }
    async fetchRawItems() {
        return [];
    }
    async extractFatwaData(rawItem) {
        return rawItem;
    }
};
TestImporter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TestImporter);
describe('BaseImporterService', () => {
    let service;
    let prismaService;
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
                return await cb(mockPrismaService);
            }),
            $executeRawUnsafe: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                TestImporter,
                { provide: prisma_service_1.PrismaService, useValue: mockPrismaService },
            ],
        }).compile();
        service = module.get(TestImporter);
        prismaService = module.get(prisma_service_1.PrismaService);
        jest.spyOn(common_1.Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(common_1.Logger.prototype, 'warn').mockImplementation(() => { });
        jest.spyOn(common_1.Logger.prototype, 'error').mockImplementation((msg, stack) => {
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
            prismaService.source.upsert.mockResolvedValue({ id: 'src-1' });
            prismaService.importJob.create.mockResolvedValue({});
            prismaService.syncStatus.upsert.mockResolvedValue({});
            prismaService.fatwa.updateMany.mockResolvedValue({ count: 0 });
        });
        it('should handle a successful pipeline with no items', async () => {
            jest.spyOn(service, 'fetchRawItems').mockResolvedValue([]);
            const result = await service.runImportPipeline();
            expect(result.status).toBe('success');
            expect(result.imported).toBe(0);
            expect(prismaService.source.upsert).toHaveBeenCalled();
            expect(prismaService.$executeRawUnsafe).not.toHaveBeenCalled();
        });
        it('should import new fatwa', async () => {
            jest.spyOn(service, 'fetchRawItems').mockResolvedValue([{
                    slug: 'test-fatwa-1', question: 'سؤال طويل جدا', answer: 'هذا هو الجواب الطويل والمفصل', url: 'https://test.com/1'
                }]);
            prismaService.fatwa.findUnique.mockResolvedValue(null);
            prismaService.fatwa.create.mockResolvedValue({ id: 'fatwa-1' });
            const result = await service.runImportPipeline();
            expect(result.status).toBe('success');
            expect(result.imported).toBe(1);
            expect(prismaService.fatwa.create).toHaveBeenCalled();
            expect(prismaService.$executeRawUnsafe).toHaveBeenCalledTimes(2);
        });
        it('should skip invalid fatwa', async () => {
            jest.spyOn(service, 'fetchRawItems').mockResolvedValue([{
                    slug: 'test-fatwa-2', question: '', answer: '', url: 'https://test.com/2'
                }]);
            const result = await service.runImportPipeline();
            expect(result.status).toBe('success');
            expect(result.skipped).toBe(1);
            expect(prismaService.fatwa.create).not.toHaveBeenCalled();
        });
        it('should detect duplicate fatwa without updating', async () => {
            const item = { slug: 'test-fatwa-3', question: 'سؤال طويل جدا', answer: 'هذا هو الجواب الطويل والمفصل', url: 'https://test.com/3' };
            jest.spyOn(service, 'fetchRawItems').mockResolvedValue([item]);
            const expectedFingerprint = service.calculateFingerprint(item.url, item.question, item.answer);
            prismaService.fatwa.findUnique.mockResolvedValue({
                id: 'fatwa-3',
                sourceFingerprint: expectedFingerprint
            });
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
            });
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
                .mockRejectedValueOnce(new Error('Extract error'))
                .mockResolvedValueOnce({ slug: 'test-6', question: 'سؤال طويل جدا', answer: 'هذا هو الجواب الطويل والمفصل', url: 'https://test.com/6' });
            prismaService.fatwa.findUnique.mockResolvedValue(null);
            const result = await service.runImportPipeline();
            expect(result.status).toBe('success');
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
//# sourceMappingURL=base-importer.service.spec.js.map