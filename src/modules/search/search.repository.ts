import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { SynonymService } from './synonym.service';

export interface SearchResult {
  id: string;
  slug: string;
  questionTitle: string;
  question: string;
  answer: string;
  scholar: string;
  category: string;
  source: string;
  score?: number;
}

@Injectable()
export class SearchRepository {
  private readonly logger = new Logger(SearchRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly synonymService: SynonymService
  ) {}

  async search(query: string, page: number = 1, limit: number = 20, scholar?: string): Promise<{ data: SearchResult[], total: number, engine: 'fts' | 'fallback', aggregations?: any }> {
    console.log("[Repository] search()");
    this.logger.log('Repository Started');
    try {
      const ftsResult = await this.searchFTS(query, page, limit, scholar);
      const totalAcrossAll = (Object.values(ftsResult.aggregations?.scholars || {}).reduce((a: any, b: any) => a + b, 0)) as number;

      if (ftsResult.total > 0 || totalAcrossAll > 0) {
        return { ...ftsResult, engine: 'fts' };
      }
      this.logger.log('FTS returned 0 results globally, trying fallback...');
      const fallbackResult = await this.searchFallback(query, page, limit, scholar);
      return { ...fallbackResult, engine: fallbackResult.total > 0 ? 'fallback' : 'fts' };
    } catch (error: any) {
      this.logger.warn(`FTS query failed, falling back to basic search: ${error.message}`);
      
      const fallbackResult = await this.searchFallback(query, page, limit, scholar);
      return { ...fallbackResult, engine: 'fallback' };
    }
  }

  async searchFTS(query: string, page: number, limit: number, scholar?: string): Promise<{ data: SearchResult[], total: number, aggregations: any }> {
    this.logger.log('FTS Query Started');
    const offset = (page - 1) * limit;

    const expandedQuery = await this.synonymService.getExpandedTsQuery(query);
    if (!expandedQuery) {
      return { data: [], total: 0, aggregations: { scholars: {} } };
    }

    const scholarFilter = scholar ? Prisma.sql`AND s.slug = ${scholar}` : Prisma.empty;

    // ts_rank weights: {D, C, B, A} = {0.1, 0.2, 0.4, 1.0}
    const rawQuery = Prisma.sql`
      SELECT 
        f.id, f.slug, f.question, f.answer, 
        s.name as scholar, c.name as category, src.name as source,
        (
          CASE
            WHEN f.question ILIKE '%' || ${query} || '%' THEN 5000
            WHEN EXISTS(SELECT 1 FROM fatwa_keywords fk JOIN keywords k ON fk.keyword_id = k.id WHERE fk.fatwa_id = f.id AND k.word ILIKE '%' || ${query} || '%') THEN 3000
            WHEN f.answer ILIKE '%' || ${query} || '%' THEN 500
            ELSE 0
          END
          + (ts_rank_cd('{0.1, 0.2, 0.4, 1.0}', si.search_vector, to_tsquery('arabic', ${expandedQuery})) * 100)
        ) as score
      FROM fatawa f
      JOIN search_index si ON f.id = si.fatwa_id
      JOIN scholars s ON f.scholar_id = s.id
      JOIN categories c ON f.category_id = c.id
      JOIN sources src ON f.source_id = src.id
      WHERE si.search_vector @@ to_tsquery('arabic', ${expandedQuery})
        AND f.verification_status = 'verified'
        ${scholarFilter}
      ORDER BY score DESC, f.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = Prisma.sql`
      SELECT COUNT(*)::int as total
      FROM fatawa f
      JOIN search_index si ON f.id = si.fatwa_id
      JOIN scholars s ON f.scholar_id = s.id
      WHERE si.search_vector @@ to_tsquery('arabic', ${expandedQuery})
        AND f.verification_status = 'verified'
        ${scholarFilter}
    `;

    // Aggregation query to get counts per scholar regardless of the scholar filter
    const aggQuery = Prisma.sql`
      SELECT s.slug, COUNT(*)::int as count
      FROM fatawa f
      JOIN search_index si ON f.id = si.fatwa_id
      JOIN scholars s ON f.scholar_id = s.id
      WHERE si.search_vector @@ to_tsquery('arabic', ${expandedQuery})
        AND f.verification_status = 'verified'
      GROUP BY s.slug
    `;

    this.logger.log('COUNT Query Started');
    const [data, countResult, aggResult] = await Promise.all([
      this.prisma.$queryRaw<SearchResult[]>(rawQuery),
      this.prisma.$queryRaw<{total: number}[]>(countQuery),
      this.prisma.$queryRaw<{slug: string, count: number}[]>(aggQuery)
    ]);

    this.logger.log(`typeof countResult[0]?.total: ${typeof countResult[0]?.total}`);
    const total = Number(countResult[0]?.total || 0);
    
    const mappedData = data.map((item: any) => ({
      ...item,
      questionTitle: item.question.substring(0, 80) + '...',
    }));

    const aggregations = {
      scholars: {} as Record<string, number>
    };

    if (aggResult) {
      aggResult.forEach(row => {
        aggregations.scholars[row.slug] = Number(row.count);
      });
    }

    return { data: mappedData, total, aggregations };
  }

  async searchFallback(query: string, page: number, limit: number, scholar?: string): Promise<{ data: SearchResult[], total: number, aggregations: any }> {
    const terms = query.split(' ').filter(t => t.length > 1);
    
    if (terms.length === 0) {
      return { data: [], total: 0, aggregations: { scholars: {} } };
    }

    const searchConditions = terms.map(term => ({
      OR: [
        { question: { contains: term, mode: Prisma.QueryMode.insensitive } },
        { answer: { contains: term, mode: Prisma.QueryMode.insensitive } },
        { scholar: { name: { contains: term, mode: Prisma.QueryMode.insensitive } } },
        { category: { name: { contains: term, mode: Prisma.QueryMode.insensitive } } },
      ]
    }));

    const limitCandidates = parseInt(process.env.SEARCH_FALLBACK_MAX_CANDIDATES as any, 10) || 500;

    try {
      const rawData = await this.prisma.fatwa.findMany({
        where: {
          AND: [
            { verificationStatus: 'verified' },
            // Don't filter by scholar here so we can aggregate
            ...searchConditions
          ]
        },
        include: { scholar: true, category: true, source: true },
        take: limitCandidates 
      });

      const scoredData = rawData.map(fatwa => {
      let score = 0;
      const lowerQuery = query.toLowerCase();

      if (fatwa.question?.toLowerCase().includes(lowerQuery)) score += 5000;
      if (fatwa.answer?.toLowerCase().includes(lowerQuery)) score += 500;
      if (fatwa.scholar?.name?.toLowerCase().includes(lowerQuery)) score += 40;
      if (fatwa.category?.name?.toLowerCase().includes(lowerQuery)) score += 50;

      terms.forEach(term => {
        const lowerTerm = term.toLowerCase();
        if (fatwa.question?.toLowerCase().includes(lowerTerm)) score += 80;
        if (fatwa.answer?.toLowerCase().includes(lowerTerm)) score += 20;
      });

      return {
        id: fatwa.id,
        slug: fatwa.slug,
        questionTitle: fatwa.question ? (fatwa.question.substring(0, 80) + '...') : '',
        question: fatwa.question || '',
        answer: fatwa.answer || '',
        scholar: fatwa.scholar?.name || 'غير معروف',
        category: fatwa.category?.name || 'غير مصنف',
        source: fatwa.source?.name || 'غير معروف',
        score
      };
    });

      scoredData.sort((a, b) => b.score - a.score);

      // Filter by scholar if requested
      const filteredData = scholar ? scoredData.filter(d => d.slug === scholar) : scoredData;

      const total = filteredData.length;
      const offset = (page - 1) * limit;
      const paginatedData = filteredData.slice(offset, offset + limit);

      const aggregations = { scholars: {} as Record<string, number> };
      scoredData.forEach(d => {
        // Find scholar slug from raw data to aggregate
        const rawItem = rawData.find(r => r.id === d.id);
        if (rawItem && rawItem.scholar?.slug) {
          aggregations.scholars[rawItem.scholar.slug] = (aggregations.scholars[rawItem.scholar.slug] || 0) + 1;
        }
      });

      return { data: paginatedData, total, aggregations };
    } catch (e: any) {
      this.logger.error(`Exception Name: ${e.name}`);
      this.logger.error(`Message: ${e.message}`);
      this.logger.error(`Stack: ${e.stack}`);
      throw e;
    }
  }

  async autocomplete(q: string, scholar?: string) {
    // 1. Exact Match Questions (Limit 5)
    const questions = await this.prisma.fatwa.findMany({
      where: { 
        question: { contains: q, mode: Prisma.QueryMode.insensitive }, 
        verificationStatus: 'verified',
        ...(scholar ? { scholar: { slug: scholar } } : [])
      },
      select: { question: true },
      take: 5
    });

    // 2. Keywords
    const keywords = await this.prisma.keyword.findMany({
      where: { word: { startsWith: q, mode: Prisma.QueryMode.insensitive } },
      select: { word: true },
      take: 3
    });

    // 3. Synonyms
    const synonyms = await this.prisma.synonym.findMany({
      where: { word: { startsWith: q, mode: Prisma.QueryMode.insensitive } },
      select: { word: true },
      take: 3
    });

    // 4. Categories
    const categories = await this.prisma.category.findMany({
      where: { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
      select: { name: true },
      take: 3
    });

    // 5. Scholars
    const scholars = await this.prisma.scholar.findMany({
      where: { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
      select: { name: true },
      take: 2
    });

    const suggestions = new Set<string>();

    questions.forEach(f => suggestions.add(f.question.substring(0, 60)));
    keywords.forEach(k => suggestions.add(k.word));
    synonyms.forEach(s => suggestions.add(s.word));
    categories.forEach(c => suggestions.add(c.name));
    scholars.forEach(s => suggestions.add(`فتاوى ${s.name}`));

    return Array.from(suggestions).slice(0, 10).map(term => ({ term }));
  }

  async logSearch(query: string, resultsCount: number, executionMs: number, engine: string) {
    try {
      await this.prisma.searchLog.create({
        data: {
          query,
          resultsCount,
          executionMs,
        }
      });
    } catch (e: any) {
      this.logger.error(`Failed to log search: ${e.message}`);
    }
  }

  async getTrendingSearches() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.searchLog.groupBy({
      by: ['query'],
      _count: { query: true },
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: {
        _count: { query: 'desc' }
      },
      take: 10
    });

    return result.map(r => r.query);
  }

  async rebuildSearchIndex() {
    this.logger.log('Rebuilding PostgreSQL Search Index...');
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO search_index (fatwa_id, normalized_text, updated_at)
        SELECT 
          f.id, 
          concat_ws(' ', f.question, f.answer, s.name, c.name), 
          NOW()
        FROM fatawa f
        LEFT JOIN scholars s ON f.scholar_id = s.id
        LEFT JOIN categories c ON f.category_id = c.id
        ON CONFLICT (fatwa_id) DO UPDATE SET 
          normalized_text = EXCLUDED.normalized_text,
          updated_at = NOW();
      `);

      await this.prisma.$executeRawUnsafe(`
        UPDATE search_index si
        SET search_vector = 
          setweight(to_tsvector('arabic', coalesce(f.question, '') || ' ' || coalesce((SELECT string_agg(k.word, ' ') FROM fatwa_keywords fk JOIN keywords k ON fk.keyword_id = k.id WHERE fk.fatwa_id = f.id), '')), 'A') ||
          setweight(to_tsvector('arabic', coalesce(s.name, '') || ' ' || coalesce(c.name, '')), 'B') ||
          setweight(to_tsvector('arabic', coalesce(f.answer, '')), 'C')
        FROM fatawa f
        LEFT JOIN scholars s ON f.scholar_id = s.id
        LEFT JOIN categories c ON f.category_id = c.id
        WHERE f.id = si.fatwa_id;
      `);
      this.logger.log('Search Index rebuilt successfully.');
    } catch (error: any) {
      this.logger.error(`Failed to rebuild search index: ${error.message}`);
    }
  }

  async rebuildSearchIndexForSource(sourceId: string) {
    this.logger.log(`Rebuilding PostgreSQL Search Index for source: ${sourceId}...`);
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO search_index (fatwa_id, normalized_text, updated_at)
        SELECT 
          f.id, 
          concat_ws(' ', f.question, f.answer, s.name, c.name), 
          NOW()
        FROM fatawa f
        LEFT JOIN scholars s ON f.scholar_id = s.id
        LEFT JOIN categories c ON f.category_id = c.id
        WHERE f.source_id = '${sourceId}'
        ON CONFLICT (fatwa_id) DO UPDATE SET 
          normalized_text = EXCLUDED.normalized_text,
          updated_at = NOW();
      `);

      await this.prisma.$executeRawUnsafe(`
        UPDATE search_index si
        SET search_vector = 
          setweight(to_tsvector('arabic', coalesce(f.question, '') || ' ' || coalesce((SELECT string_agg(k.word, ' ') FROM fatwa_keywords fk JOIN keywords k ON fk.keyword_id = k.id WHERE fk.fatwa_id = f.id), '')), 'A') ||
          setweight(to_tsvector('arabic', coalesce(s.name, '') || ' ' || coalesce(c.name, '')), 'B') ||
          setweight(to_tsvector('arabic', coalesce(f.answer, '')), 'C')
        FROM fatawa f
        LEFT JOIN scholars s ON f.scholar_id = s.id
        LEFT JOIN categories c ON f.category_id = c.id
        WHERE f.id = si.fatwa_id AND f.source_id = '${sourceId}';
      `);
      this.logger.log(`Search Index rebuilt successfully for source: ${sourceId}`);
    } catch (error: any) {
      this.logger.error(`Failed to rebuild search index for source: ${error.message}`);
    }
  }

  async getAllSynonyms() {
    return this.prisma.synonym.findMany({
      orderBy: { word: 'asc' }
    });
  }
}
