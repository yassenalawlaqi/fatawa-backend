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
var SearchController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const search_service_1 = require("./search.service");
const search_dto_1 = require("./dto/search.dto");
const swagger_1 = require("@nestjs/swagger");
let SearchController = SearchController_1 = class SearchController {
    searchService;
    constructor(searchService) {
        this.searchService = searchService;
    }
    logger = new common_1.Logger(SearchController_1.name);
    async searchGet(query) {
        console.log("[Controller] searchGet entered");
        this.logger.log(`\n==== Search Started ====`);
        this.logger.log(`Query: ${query.query || query.q}`);
        this.logger.log(`Page: ${query.page}`);
        this.logger.log(`Limit: ${query.limit}`);
        try {
            const result = await this.searchService.search(query);
            this.logger.log(`==== Search Finished ====\n`);
            return result;
        }
        catch (e) {
            this.logger.error(`Exception Name: ${e.name}`);
            this.logger.error(`Message: ${e.message}`);
            this.logger.error(`Stack: ${e.stack}`);
            throw e;
        }
    }
    async searchPost(query) {
        return this.searchService.search(query);
    }
    async autocomplete(q) {
        return this.searchService.autocomplete(q);
    }
    async trending() {
        return this.searchService.getTrendingSearches();
    }
    async getSynonyms() {
        const synonyms = await this.searchService.getAllSynonyms();
        return { success: true, data: synonyms };
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search fatawa (GET)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successful search response.' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_dto_1.SearchQueryDto]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchGet", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search fatawa (POST with advanced filters)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successful search response.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_dto_1.SearchQueryDto]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchPost", null);
__decorate([
    (0, common_1.Get)('autocomplete'),
    (0, swagger_1.ApiOperation)({ summary: 'Autocomplete suggestions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successful autocomplete response.' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "autocomplete", null);
__decorate([
    (0, common_1.Get)('trending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get trending searches' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successful trending response.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "trending", null);
__decorate([
    (0, common_1.Get)('synonyms'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all synonyms (Read-Only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns list of synonyms' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSynonyms", null);
exports.SearchController = SearchController = SearchController_1 = __decorate([
    (0, swagger_1.ApiTags)('Search'),
    (0, common_1.Controller)({ path: 'public/search', version: '1' }),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map