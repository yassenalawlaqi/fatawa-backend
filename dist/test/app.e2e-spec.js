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
const app_module_1 = require("./../src/app.module");
describe('App (e2e)', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.enableVersioning();
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    describe('System API', () => {
        it('/v1/system/health (GET)', () => {
            return request(app.getHttpServer())
                .get('/v1/system/health')
                .expect(200)
                .expect((res) => {
                expect(res.body.status).toBe('ok');
            });
        });
        it('/v1/system/ready (GET)', () => {
            return request(app.getHttpServer())
                .get('/v1/system/ready')
                .expect(200)
                .expect((res) => {
                expect(res.body.status).toBe('ready');
            });
        });
    });
    describe('Search API', () => {
        it('/v1/search (POST) - Empty query', () => {
            return request(app.getHttpServer())
                .post('/v1/search')
                .send({ query: '' })
                .expect(201)
                .expect((res) => {
                expect(res.body).toHaveProperty('data');
                expect(res.body).toHaveProperty('pagination');
            });
        });
        it('/v1/search (POST) - Single word', () => {
            return request(app.getHttpServer())
                .post('/v1/search')
                .send({ query: 'صلاة', page: 1, limit: 10 })
                .expect(201)
                .expect((res) => {
                expect(res.body).toHaveProperty('data');
            });
        });
        it('/v1/search (POST) - Full sentence', () => {
            return request(app.getHttpServer())
                .post('/v1/search')
                .send({ query: 'ما حكم صلاة الجماعة في المسجد للمقيم؟', page: 1, limit: 10 })
                .expect(201);
        });
        it('/v1/search (POST) - No Tashkeel', () => {
            return request(app.getHttpServer())
                .post('/v1/search')
                .send({ query: 'زكاه الفطر', page: 1, limit: 10 })
                .expect(201);
        });
        it('/v1/search (POST) - With Tashkeel', () => {
            return request(app.getHttpServer())
                .post('/v1/search')
                .send({ query: 'صَلاةُ الجَمَاعَةِ', page: 1, limit: 10 })
                .expect(201);
        });
        it('/v1/search (POST) - Typo variation', () => {
            return request(app.getHttpServer())
                .post('/v1/search')
                .send({ query: 'ابن/إبن صلاة/صلاه', page: 1, limit: 10 })
                .expect(201);
        });
        it('/v1/search/autocomplete (GET)', () => {
            return request(app.getHttpServer())
                .get('/v1/search/autocomplete?q=test')
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('suggestions');
            });
        });
        it('/v1/search/trending (GET)', () => {
            return request(app.getHttpServer())
                .get('/v1/search/trending')
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('trending');
            });
        });
    });
    describe('Fatawa API', () => {
        it('/v1/fatawa/:id (GET) - Invalid ID', () => {
            return request(app.getHttpServer())
                .get('/v1/fatawa/invalid-id')
                .expect(404);
        });
    });
});
//# sourceMappingURL=app.e2e-spec.js.map