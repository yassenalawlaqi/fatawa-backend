import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { SearchRepository } from '../../src/modules/search/search.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

describe('Scholar Filter Regression (e2e)', () => {
  let app: INestApplication;
  let searchRepo: SearchRepository;
  let cacheManager: Cache;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    searchRepo = app.get<SearchRepository>(SearchRepository);
    cacheManager = app.get(CACHE_MANAGER);
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
