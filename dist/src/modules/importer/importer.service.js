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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ImporterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImporterService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const binbaz_importer_1 = require("./plugins/binbaz.importer");
const uthaymeen_importer_1 = require("./plugins/uthaymeen.importer");
const fawzan_importer_1 = require("./plugins/fawzan.importer");
const committee_importer_1 = require("./plugins/committee.importer");
const audit_service_1 = require("../system/audit.service");
const search_repository_1 = require("../search/search.repository");
const schedule_1 = require("@nestjs/schedule");
let ImporterService = ImporterService_1 = class ImporterService {
    importQueue;
    binbazImporter;
    uthaymeenImporter;
    fawzanImporter;
    committeeImporter;
    auditService;
    searchRepository;
    logger = new common_1.Logger(ImporterService_1.name);
    plugins = new Map();
    constructor(importQueue, binbazImporter, uthaymeenImporter, fawzanImporter, committeeImporter, auditService, searchRepository) {
        this.importQueue = importQueue;
        this.binbazImporter = binbazImporter;
        this.uthaymeenImporter = uthaymeenImporter;
        this.fawzanImporter = fawzanImporter;
        this.committeeImporter = committeeImporter;
        this.auditService = auditService;
        this.searchRepository = searchRepository;
        this.registerPlugin(this.binbazImporter);
        this.registerPlugin(this.uthaymeenImporter);
        this.registerPlugin(this.fawzanImporter);
        this.registerPlugin(this.committeeImporter);
    }
    onModuleInit() {
    }
    registerPlugin(plugin) {
        this.plugins.set(plugin.sourceSlug, plugin);
        this.logger.log(`Registered Importer Plugin: ${plugin.sourceName}`);
    }
    async scheduleImport(sourceSlug) {
        if (sourceSlug === 'all') {
            for (const [slug] of this.plugins) {
                await this.importQueue.add('run-import', { sourceSlug: slug });
            }
            this.logger.log(`Scheduled import for ALL sources`);
            return { success: true, message: 'Scheduled imports for all sources' };
        }
        if (!this.plugins.has(sourceSlug)) {
            throw new Error(`Plugin ${sourceSlug} not found`);
        }
        await this.importQueue.add('run-import', { sourceSlug });
        this.logger.log(`Scheduled import for ${sourceSlug}`);
        return { success: true, message: `Scheduled import for ${sourceSlug}` };
    }
    async executeImport(sourceSlug) {
        const plugin = this.plugins.get(sourceSlug);
        if (!plugin)
            throw new Error(`Plugin not found for ${sourceSlug}`);
        this.logger.log(`Executing import pipeline for ${plugin.sourceName}...`);
        const result = await plugin.runImportPipeline();
        await this.auditService.logAction('RUN_IMPORT', 'ImportLog', '00000000-0000-0000-0000-000000000000', JSON.stringify(result));
        await this.searchRepository.rebuildSearchIndex();
        return result;
    }
    async handleCron() {
        this.logger.log('Running scheduled imports (every 6 hours)...');
        try {
            await this.scheduleImport('all');
        }
        catch (e) {
            this.logger.error(`Failed to schedule imports: ${e.message}`);
        }
    }
    getSyncStatus() {
        return this.plugins.keys();
    }
};
exports.ImporterService = ImporterService;
__decorate([
    (0, schedule_1.Cron)('0 */6 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ImporterService.prototype, "handleCron", null);
exports.ImporterService = ImporterService = ImporterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('import-queue')),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        binbaz_importer_1.BinBazImporter,
        uthaymeen_importer_1.UthaymeenImporter,
        fawzan_importer_1.FawzanImporter,
        committee_importer_1.PermanentCommitteeImporter,
        audit_service_1.AuditService,
        search_repository_1.SearchRepository])
], ImporterService);
//# sourceMappingURL=importer.service.js.map