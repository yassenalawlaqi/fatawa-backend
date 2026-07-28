import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Performance Tests (Jest + Promise.all)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
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
      reqPromises.push(
        request(app.getHttpServer())
          .get('/v1/public/search?q=test&page=1&limit=10')
          .expect(200)
      );
    }

    const responses = await Promise.all(reqPromises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Check all responses succeeded
    responses.forEach(res => {
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    // Ensure it processed 50 requests in less than 3000ms (rough benchmark)
    expect(totalTime).toBeLessThan(3000);
    console.log(`[Performance] 50 concurrent requests processed in ${totalTime}ms`);
  });
});
