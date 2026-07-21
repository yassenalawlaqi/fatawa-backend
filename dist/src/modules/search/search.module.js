"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchModule = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const search_controller_1 = require("./search.controller");
const search_service_1 = require("./search.service");
const search_repository_1 = require("./search.repository");
const prisma_module_1 = require("../prisma/prisma.module");
let SearchModule = class SearchModule {
};
exports.SearchModule = SearchModule;
exports.SearchModule = SearchModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            cache_manager_1.CacheModule.registerAsync({
                isGlobal: true,
                useFactory: () => {
                    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
                        const redisStore = require('cache-manager-redis-store');
                        let host = process.env.REDIS_HOST || 'localhost';
                        let port = process.env.REDIS_PORT || 6379;
                        let password = process.env.REDIS_PASSWORD;
                        if (process.env.REDIS_URL) {
                            const parsed = new URL(process.env.REDIS_URL);
                            host = parsed.hostname;
                            port = parsed.port || 6379;
                            if (parsed.password)
                                password = parsed.password;
                        }
                        return {
                            store: redisStore,
                            host,
                            port,
                            password,
                            ttl: 21600000,
                        };
                    }
                    return { ttl: 21600000 };
                }
            })
        ],
        controllers: [search_controller_1.SearchController],
        providers: [
            search_repository_1.SearchRepository,
            search_service_1.SearchService,
            {
                provide: 'ISearchProvider',
                useExisting: search_service_1.SearchService,
            },
        ],
        exports: ['ISearchProvider', search_repository_1.SearchRepository],
    })
], SearchModule);
//# sourceMappingURL=search.module.js.map