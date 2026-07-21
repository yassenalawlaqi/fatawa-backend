import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { SearchRepository } from './search.repository';

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: SearchRepository,
          useValue: { search: jest.fn() }
        },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn(), set: jest.fn() }
        }
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
