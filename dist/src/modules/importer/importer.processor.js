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
var ImporterProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImporterProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const importer_service_1 = require("./importer.service");
let ImporterProcessor = ImporterProcessor_1 = class ImporterProcessor extends bullmq_1.WorkerHost {
    importerService;
    logger = new common_1.Logger(ImporterProcessor_1.name);
    constructor(importerService) {
        super();
        this.importerService = importerService;
    }
    async process(job) {
        this.logger.log(`Processing job ${job.id} of type ${job.name}`);
        if (job.name === 'run-import') {
            const sourceSlug = job.data.sourceSlug;
            return this.importerService.executeImport(sourceSlug);
        }
    }
};
exports.ImporterProcessor = ImporterProcessor;
exports.ImporterProcessor = ImporterProcessor = ImporterProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('import-queue'),
    __metadata("design:paramtypes", [importer_service_1.ImporterService])
], ImporterProcessor);
//# sourceMappingURL=importer.processor.js.map