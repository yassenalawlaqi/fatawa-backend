"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImporterModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const importer_service_1 = require("./importer.service");
const importer_processor_1 = require("./importer.processor");
const binbaz_importer_1 = require("./plugins/binbaz.importer");
const uthaymeen_importer_1 = require("./plugins/uthaymeen.importer");
const fawzan_importer_1 = require("./plugins/fawzan.importer");
const committee_importer_1 = require("./plugins/committee.importer");
const content_extractor_service_1 = require("./services/content-extractor.service");
const search_module_1 = require("../search/search.module");
let ImporterModule = class ImporterModule {
};
exports.ImporterModule = ImporterModule;
exports.ImporterModule = ImporterModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'import-queue',
            }),
            search_module_1.SearchModule,
        ],
        providers: [
            importer_service_1.ImporterService,
            importer_processor_1.ImporterProcessor,
            binbaz_importer_1.BinBazImporter,
            uthaymeen_importer_1.UthaymeenImporter,
            fawzan_importer_1.FawzanImporter,
            committee_importer_1.PermanentCommitteeImporter,
            content_extractor_service_1.ContentExtractorService,
        ],
        exports: [importer_service_1.ImporterService],
    })
], ImporterModule);
//# sourceMappingURL=importer.module.js.map