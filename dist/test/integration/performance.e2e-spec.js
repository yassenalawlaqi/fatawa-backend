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
describe('Performance Tests (Jest + Promise.all)', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe({ transform: true, whitelist: true }));
        app.enableVersioning();
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it('should handle 50 concurrent search requests efficiently', async () => {
        const concurrentRequests = 50;
        const reqPromises = [];
        const startTime = Date.now();
        for (let i = 0; i < concurrentRequests; i++) {
            reqPromises.push(request(app.getHttpServer())
                .get('/v1/public/search?q=test&page=1&limit=10')
                .expect(200));
        }
        const responses = await Promise.all(reqPromises);
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        responses.forEach(res => {
            expect(res.status).toBe(200);
            expect(res.body.data).toBeDefined();
        });
        expect(totalTime).toBeLessThan(3000);
        console.log(`[Performance] 50 concurrent requests processed in ${totalTime}ms`);
    });
});
//# sourceMappingURL=performance.e2e-spec.js.map