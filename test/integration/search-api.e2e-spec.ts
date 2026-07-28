import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestDbUtil } from '../utils/test-db.util';
import { PrismaService } from '../../src/modules/prisma/prisma.service';

describe('Search API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    // Hardcoded versioning setup based on main.ts
    app.enableVersioning();
    await app.init();
    
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // We expect wipeDatabase to handle everything gracefully
    await TestDbUtil.wipeDatabase();
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
      // Setup DB Data
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
      await prisma.$executeRawUnsafe(
        `INSERT INTO search_index (fatwa_id, question, answer, search_vector) VALUES ($1, $2, $3, to_tsvector('arabic', $2 || ' ' || $3))`,
        fatwa.id,
        fatwa.question,
        fatwa.answer
      );

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
