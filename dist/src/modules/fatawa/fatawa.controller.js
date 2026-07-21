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
exports.FatawaController = void 0;
const common_1 = require("@nestjs/common");
const fatawa_service_1 = require("./fatawa.service");
const swagger_1 = require("@nestjs/swagger");
let FatawaController = class FatawaController {
    fatawaService;
    constructor(fatawaService) {
        this.fatawaService = fatawaService;
    }
    async getFatawa(scholarSlug, scholarId, page = '1', limit = '20') {
        const p = parseInt(page, 10) || 1;
        const l = parseInt(limit, 10) || 20;
        const result = await this.fatawaService.getFatawaByScholar(scholarSlug || null, scholarId || null, p, l);
        return {
            data: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }
        };
    }
    async getFatwa(slug) {
        return this.fatawaService.getFatwaBySlug(slug);
    }
    async getRelated(slug) {
        return this.fatawaService.getRelatedFatawa(slug);
    }
};
exports.FatawaController = FatawaController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get fatawa (optionally by scholar)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successful response' }),
    __param(0, (0, common_1.Query)('scholarSlug')),
    __param(1, (0, common_1.Query)('scholarId')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], FatawaController.prototype, "getFatawa", null);
__decorate([
    (0, common_1.Get)(':slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single fatwa by slug' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successful response' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FatawaController.prototype, "getFatwa", null);
__decorate([
    (0, common_1.Get)(':slug/related'),
    (0, swagger_1.ApiOperation)({ summary: 'Get related fatawa' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successful response' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FatawaController.prototype, "getRelated", null);
exports.FatawaController = FatawaController = __decorate([
    (0, swagger_1.ApiTags)('Fatawa Public'),
    (0, common_1.Controller)({ path: 'public/fatawa', version: '1' }),
    __metadata("design:paramtypes", [fatawa_service_1.FatawaService])
], FatawaController);
//# sourceMappingURL=fatawa.controller.js.map