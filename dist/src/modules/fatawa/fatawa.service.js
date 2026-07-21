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
exports.FatawaService = void 0;
const common_1 = require("@nestjs/common");
const fatawa_repository_1 = require("./fatawa.repository");
let FatawaService = class FatawaService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getFatwaBySlug(slug) {
        const fatwa = await this.repository.findBySlug(slug);
        if (!fatwa) {
            throw new common_1.NotFoundException('Fatwa not found');
        }
        return fatwa;
    }
    async getRelatedFatawa(slug) {
        return this.repository.findRelated(slug);
    }
    async getFatawaByScholar(scholarSlug, scholarId, page, limit) {
        return this.repository.findByScholar(scholarSlug, scholarId, page, limit);
    }
    async getScholars() {
        return this.repository.getScholars();
    }
    async getCategories() {
        return this.repository.getCategories();
    }
};
exports.FatawaService = FatawaService;
exports.FatawaService = FatawaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fatawa_repository_1.FatawaRepository])
], FatawaService);
//# sourceMappingURL=fatawa.service.js.map