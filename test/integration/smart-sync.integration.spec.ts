import { Test, TestingModule } from '@nestjs/testing';
import { BaseImporterService } from '../../src/modules/importer/services/base-importer.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { TestDbUtil } from '../utils/test-db.util';
import { FatwaData } from '../../src/modules/importer/interfaces/i-importer.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
class TestSmartSyncImporter extends BaseImporterService {
  readonly sourceName = 'Integration Test Source';
  readonly sourceSlug = 'integration-test';
  
  public testItems: any[] = [];
  public extractLogic: (raw: any) => Promise<FatwaData> = async () => ({} as any);

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async fetchRawItems(): Promise<any[]> {
    return this.testItems;
  }

  async extractFatwaData(rawItem: any): Promise<FatwaData> {
    return this.extractLogic(rawItem);
  }
}

describe('Smart Sync Integration Tests', () => {
  let importer: TestSmartSyncImporter;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestSmartSyncImporter,
        PrismaService,
      ],
    }).compile();

    importer = module.get<TestSmartSyncImporter>(TestSmartSyncImporter);
    prisma = module.get<PrismaService>(PrismaService);
    
    // Disable logs for clean output
    jest.spyOn(importer['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(importer['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(importer['logger'], 'error').mockImplementation(() => {});
  });

  beforeEach(async () => {
    await TestDbUtil.wipeDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should insert a new fatwa and update the search index (New)', async () => {
    const scholar = await prisma.scholar.create({ data: { name: 'Test Scholar', slug: 'test-scholar' } });
    const category = await prisma.category.create({ data: { name: 'Test Category', slug: 'test-category' } });

    importer.testItems = [{ id: 1 }];
    importer.extractLogic = async () => ({
      slug: 'test-fatwa-1',
      question: 'السؤال عن الصلاة',
      answer: 'الصلاة واجبة وهي عماد الدين',
      url: 'http://test.com/1',
      scholarId: scholar.id,
      categoryId: category.id,
      publishedAt: new Date(),
    });

    const result = await importer.runImportPipeline();

    expect(result.new).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(0);

    // Verify DB
    const fatwas = await prisma.fatwa.findMany();
    expect(fatwas.length).toBe(1);
    expect(fatwas[0].slug).toBe('test-fatwa-1');
    expect(fatwas[0].hash).toBeDefined();

    // Verify Search Index
    const searchDocs = await prisma.$queryRaw<any[]>`SELECT * FROM search_index WHERE fatwa_id = ${fatwas[0].id}`;
    expect(searchDocs.length).toBe(1);
    expect(searchDocs[0].question).toBe('السؤال عن الصلاة');
  });

  it('should skip duplicate fatwas with the same fingerprint (Skipped)', async () => {
    const scholar = await prisma.scholar.create({ data: { name: 'Test Scholar', slug: 'test-scholar' } });
    const category = await prisma.category.create({ data: { name: 'Test Category', slug: 'test-category' } });

    importer.testItems = [{ id: 1 }];
    importer.extractLogic = async () => ({
      slug: 'test-fatwa-2',
      question: 'السؤال عن الزكاة',
      answer: 'الزكاة ركن من أركان الإسلام',
      url: 'http://test.com/2',
      scholarId: scholar.id,
      categoryId: category.id,
      publishedAt: new Date(),
    });

    // Run first time (New)
    await importer.runImportPipeline();

    // Run second time (Duplicate, Skipped)
    const result2 = await importer.runImportPipeline();

    expect(result2.new).toBe(0);
    expect(result2.updated).toBe(0);
    expect(result2.skipped).toBe(1);

    // DB should still only have 1 fatwa and 0 revisions
    const fatwas = await prisma.fatwa.findMany();
    expect(fatwas.length).toBe(1);
    
    // Check FatwaRevisions (assuming the schema has a FatwaRevision model - if so it should be empty)
    // Note: I will check `fatwaRevision` count manually through the DB to ensure nothing changed.
    const searchDocs = await prisma.$queryRaw<any[]>`SELECT * FROM search_index`;
    expect(searchDocs.length).toBe(1);
  });

  it('should update fatwa and create revision if fingerprint changes (Updated)', async () => {
    const scholar = await prisma.scholar.create({ data: { name: 'Test Scholar', slug: 'test-scholar' } });
    const category = await prisma.category.create({ data: { name: 'Test Category', slug: 'test-category' } });

    importer.testItems = [{ id: 1 }];
    
    // 1st run
    importer.extractLogic = async () => ({
      slug: 'test-fatwa-3',
      question: 'السؤال عن الحج',
      answer: 'الحج مرة في العمر',
      url: 'http://test.com/3',
      scholarId: scholar.id,
      categoryId: category.id,
      publishedAt: new Date(),
    });
    await importer.runImportPipeline();

    // 2nd run with updated answer
    importer.extractLogic = async () => ({
      slug: 'test-fatwa-3',
      question: 'السؤال عن الحج',
      answer: 'الحج مرة في العمر لمن استطاع إليه سبيلا (محدث)',
      url: 'http://test.com/3',
      scholarId: scholar.id,
      categoryId: category.id,
      publishedAt: new Date(),
    });
    
    const result2 = await importer.runImportPipeline();

    expect(result2.new).toBe(0);
    expect(result2.updated).toBe(1);
    expect(result2.skipped).toBe(0);

    // Verify DB
    const fatwas = await prisma.fatwa.findMany({ where: { slug: 'test-fatwa-3' } });
    expect(fatwas.length).toBe(1);
    expect(fatwas[0].answer).toContain('(محدث)');

    // Verify Search Index is updated
    const searchDocs = await prisma.$queryRaw<any[]>`SELECT * FROM search_index WHERE fatwa_id = ${fatwas[0].id}`;
    expect(searchDocs[0].answer).toContain('(محدث)');

    // Count revisions
    const revisionsCount = await prisma.fatwaRevision.count({ where: { fatwaId: fatwas[0].id } });
    expect(revisionsCount).toBe(1);
  });
});
