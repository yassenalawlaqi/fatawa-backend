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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const importer_service_1 = require("../importer/importer.service");
let AdminController = class AdminController {
    importerService;
    constructor(importerService) {
        this.importerService = importerService;
    }
    async runImport(sourceSlug) {
        const target = sourceSlug || 'all';
        return await this.importerService.scheduleImport(target);
    }
    async getSyncStatus() {
        return { success: true, message: 'Sync status endpoint ready.' };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)(['import/run', 'import/run/:sourceSlug']),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger manual import for a source or all sources' }),
    __param(0, (0, common_1.Param)('sourceSlug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "runImport", null);
__decorate([
    (0, common_1.Get)('import/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current sync status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSyncStatus", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [importer_service_1.ImporterService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map