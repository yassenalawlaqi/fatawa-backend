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
exports.CategoriesController = void 0;
const common_1 = require("@nestjs/common");
const fatawa_service_1 = require("./fatawa.service");
const swagger_1 = require("@nestjs/swagger");
let CategoriesController = class CategoriesController {
    fatawaService;
    constructor(fatawaService) {
        this.fatawaService = fatawaService;
    }
    async getCategories() {
        return this.fatawaService.getCategories();
    }
};
exports.CategoriesController = CategoriesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all categories' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successful response' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CategoriesController.prototype, "getCategories", null);
exports.CategoriesController = CategoriesController = __decorate([
    (0, swagger_1.ApiTags)('Categories Public'),
    (0, common_1.Controller)({ path: 'public/categories', version: '1' }),
    __metadata("design:paramtypes", [fatawa_service_1.FatawaService])
], CategoriesController);
//# sourceMappingURL=categories.controller.js.map