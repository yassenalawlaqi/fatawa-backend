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
const common_1 = require("@nestjs/common");
const request = __importStar(require("supertest"));
const app_module_1 = require("../../src/app.module");
const test_db_util_1 = require("../utils/test-db.util");
const prisma_service_1 = require("../../src/modules/prisma/prisma.service");
describe('Search API (e2e)', () => {
    let app;
    let prisma;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe({ transform: true, whitelist: true }));
        app.enableVersioning();
        await app.init();
        prisma = moduleFixture.get(prisma_service_1.PrismaService);
    });
    beforeEach(async () => {
        await test_db_util_1.TestDbUtil.wipeDatabase();
    });
    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });
    describe('GET /v1/public/search', () => {
        it('should return 400 Validation Error if query is missing', () => {
            return request(app.getHttpServer())
                .get('/v1/public/search')
                .expect(400)
                .expect((res) => {
                expect(res.body.message).toContain('query must be a string');
            });
        });
        it('should return empty list if no results match (Happy Path)', () => {
            return request(app.getHttpServer())
                .get('/v1/public/search?q=كلمة_غير_موجودة&page=1&limit=10')
                .expect(200)
                .expect((res) => {
                expect(res.body.data).toEqual([]);
                expect(res.body.meta.total).toBe(0);
                expect(res.body.meta.page).toBe(1);
            });
        });
        it('should validate limit maximum size (Max 50)', () => {
            return request(app.getHttpServer())
                .get('/v1/public/search?q=test&limit=100')
                .expect(400)
                .expect((res) => {
                expect(res.body.message).toContain('limit must not be greater than 50');
            });
        });
        it('should retrieve correctly inserted fatwa', async () => {
            const scholar = await prisma.scholar.create({ data: { name: 'Test Scholar', slug: 'test-scholar' } });
            const category = await prisma.category.create({ data: { name: 'Test Category', slug: 'test-category' } });
            const fatwa = await prisma.fatwa.create({
                data: {
                    slug: 'test-fatwa-e2e',
                    question: 'السؤال عن الصلاة في العيد',
                    answer: 'الصلاة واجبة',
                    url: 'http://test.com/e2e',
                    scholarId: scholar.id,
                    categoryId: category.id,
                    publishedAt: new Date(),
                    hash: 'hash-e2e'
                }
            });
            await prisma.$executeRawUnsafe(`INSERT INTO search_index (fatwa_id, question, answer, search_vector) VALUES ($1, $2, $3, to_tsvector('arabic', $2 || ' ' || $3))`, fatwa.id, fatwa.question, fatwa.answer);
            return request(app.getHttpServer())
                .get('/v1/public/search?q=الصلاة&page=1&limit=10')
                .expect(200)
                .expect((res) => {
                expect(res.body.data.length).toBe(1);
                expect(res.body.data[0].slug).toBe('test-fatwa-e2e');
                expect(res.body.data[0].question).toContain('الصلاة');
            });
        });
    });
});
//# sourceMappingURL=search-api.e2e-spec.js.map