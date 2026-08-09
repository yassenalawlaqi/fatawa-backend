"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const request = __importStar(require("supertest"));
const app_module_1 = require("../../src/app.module");
const search_repository_1 = require("../../src/modules/search/search.repository");
const cache_manager_1 = require("@nestjs/cache-manager");
describe('Scholar Filter Regression (e2e)', () => {
    let app;
    let searchRepo;
    let cacheManager;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        searchRepo = app.get(search_repository_1.SearchRepository);
        cacheManager = app.get(cache_manager_1.CACHE_MANAGER);
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it('GET /public/search?q=جمعة مباركة should search all scholars', async () => {
        const searchSpy = jest.spyOn(searchRepo, 'search').mockResolvedValue({ data: [], total: 0, engine: 'fts' });
        const q = encodeURIComponent('جمعة مباركة');
        await request(app.getHttpServer())
            .get(`/public/search?q=${q}`)
            .expect(200);
        expect(searchSpy).toHaveBeenCalledWith('جمعة مباركة', 1, 20, undefined);
    });
    it('GET /public/search?q=جمعة مباركة&scholar=binbaz-official should filter by Bin Baz', async () => {
        const searchSpy = jest.spyOn(searchRepo, 'search').mockResolvedValue({ data: [], total: 0, engine: 'fts' });
        const q = encodeURIComponent('جمعة مباركة');
        await request(app.getHttpServer())
            .get(`/public/search?q=${q}&scholar=binbaz-official`)
            .expect(200);
        expect(searchSpy).toHaveBeenCalledWith('جمعة مباركة', 1, 20, 'binbaz-official');
    });
    it('GET /public/search?q=جمعة مباركة&scholar=uthaymeen-official should filter by Uthaymeen', async () => {
        const searchSpy = jest.spyOn(searchRepo, 'search').mockResolvedValue({ data: [], total: 0, engine: 'fts' });
        const q = encodeURIComponent('جمعة مباركة');
        await request(app.getHttpServer())
            .get(`/public/search?q=${q}&scholar=uthaymeen-official`)
            .expect(200);
        expect(searchSpy).toHaveBeenCalledWith('جمعة مباركة', 1, 20, 'uthaymeen-official');
    });
    it('GET /public/search/autocomplete?q=كشف&scholar=binbaz-official should filter autocomplete by Bin Baz', async () => {
        const autocompleteSpy = jest.spyOn(searchRepo, 'autocomplete').mockResolvedValue([]);
        const q = encodeURIComponent('كشف');
        await request(app.getHttpServer())
            .get(`/public/search/autocomplete?q=${q}&scholar=binbaz-official`)
            .expect(200);
        expect(autocompleteSpy).toHaveBeenCalledWith('كشف', 'binbaz-official');
    });
    it('Redis Cache keys should be separated by scholar', async () => {
        const cacheSpy = jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
        const q = encodeURIComponent('جمعة مباركة');
        await request(app.getHttpServer()).get(`/public/search?q=${q}&scholar=binbaz-official`);
        expect(cacheSpy).toHaveBeenCalledWith('search:جمعة مباركة:1:20:binbaz-official');
        await request(app.getHttpServer()).get(`/public/search?q=${q}&scholar=uthaymeen-official`);
        expect(cacheSpy).toHaveBeenCalledWith('search:جمعة مباركة:1:20:uthaymeen-official');
    });
});
//# sourceMappingURL=scholar-filter.e2e-spec.js.map