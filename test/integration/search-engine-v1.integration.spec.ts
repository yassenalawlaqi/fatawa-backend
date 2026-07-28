import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { SearchRepository } from '../../src/modules/search/search.repository';
import { KeywordExtractorService } from '../../src/modules/search/keyword-extractor.service';
import { SynonymService } from '../../src/modules/search/synonym.service';
import { FatawaRepository } from '../../src/modules/fatawa/fatawa.repository';
import { CacheModule } from '@nestjs/cache-manager';

describe('Search Engine V1 Features (Integration)', () => {
  let prisma: PrismaService;
  let searchRepo: SearchRepository;
  let keywordExtractor: KeywordExtractorService;
  let synonymService: SynonymService;
  let fatawaRepo: FatawaRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [
        PrismaService, 
        SearchRepository, 
        KeywordExtractorService, 
        SynonymService,
        FatawaRepository
      ],
    }).compile();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    searchRepo = moduleFixture.get<SearchRepository>(SearchRepository);
    keywordExtractor = moduleFixture.get<KeywordExtractorService>(KeywordExtractorService);
    synonymService = moduleFixture.get<SynonymService>(SynonymService);
    fatawaRepo = moduleFixture.get<FatawaRepository>(FatawaRepository);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should extract keywords based on rules', async () => {
    const keywords = await keywordExtractor.extractKeywords({
      question: 'ما حكم الصيام في السفر؟',
      answer: 'يجوز الفطر للمسافر ويقضي',
      categoryName: 'الصيام'
    });
    
    // Should extract predefined terms and category
    expect(keywords).toContain('صيام');
    expect(keywords).toContain('الصيام');
  });

  it('should expand synonym query', async () => {
    // Mock the synonym table for test
    await prisma.synonym.upsert({
      where: { word_synonym: { word: 'test_الصيام', synonym: 'test_الصوم' } },
      update: {},
      create: { word: 'test_الصيام', synonym: 'test_الصوم' }
    });

    const expanded = await synonymService.expandQuery('test_الصيام');
    expect(expanded).toContain('test_الصيام');
    expect(expanded).toContain('test_الصوم');
  });

  it('should fetch hierarchical categories', async () => {
    const rootCat = await prisma.category.create({
      data: { name: 'Root Category Test', slug: 'root-cat-test-' + Date.now() }
    });
    
    await prisma.category.create({
      data: { name: 'Child Category Test', slug: 'child-cat-test-' + Date.now(), parentId: rootCat.id }
    });

    const tree = await fatawaRepo.getCategories();
    const foundRoot = tree.find(c => c.id === rootCat.id);
    
    expect(foundRoot).toBeDefined();
    expect(foundRoot.children).toBeDefined();
    expect(foundRoot.children.length).toBeGreaterThan(0);
    expect(foundRoot.children[0].name).toBe('Child Category Test');
  });
});
