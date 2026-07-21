import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Enable versioning to match our controllers
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
        .expect(201) // POST default success is 201 in Nest, but we should probably change it to 200 in controller via @HttpCode(200). For now let's accept 201 or change controller.
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
        .expect(404); // Or 400 depending on UUID validation
    });
  });
});
