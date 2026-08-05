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
    private readonly synonymService: SynonymService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Main entry – tries FTS first, then fallback
  // ─────────────────────────────────────────────────────────────────────────
  async search(
    query: string,
    page: number = 1,
    limit: number = 20,
    scholar?: string,
    intentSubject?: string,
    semanticExpansions?: string[],
  ): Promise<{ data: SearchResult[]; total: number; engine: 'fts' | 'fallback'; aggregations?: any }> {
    this.logger.log('[Repository] search()');
    try {
      const ftsResult = await this.searchFTS(query, page, limit, scholar, intentSubject, semanticExpansions);
      const totalAcrossAll = (
        Object.values(ftsResult.aggregations?.scholars || {}).reduce(
          (a: any, b: any) => a + b,
          0,
        )
      ) as number;

      if (ftsResult.total > 0 || totalAcrossAll > 0) {
        return { ...ftsResult, engine: 'fts' };
      }

      this.logger.log('FTS returned 0 globally – trying fallback…');
      const fallbackResult = await this.searchFallback(query, page, limit, scholar, intentSubject);
      return { ...fallbackResult, engine: fallbackResult.total > 0 ? 'fallback' : 'fts' };
    } catch (error: any) {
      this.logger.warn(`FTS failed, falling back: ${error.message}`);
      const fallbackResult = await this.searchFallback(query, page, limit, scholar, intentSubject);
      return { ...fallbackResult, engine: 'fallback' };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FTS search with Intent-aware scoring
  // Priority order:
  //   1. Exact phrase match on intent subject in question  → +7000
  //   2. Exact phrase match in full question               → +5000
  //   3. Exact phrase match in keywords                    → +3000
  //   4. Exact phrase match in answer                      → +1500
  //   5. ts_rank_cd                                        → *100
  // ─────────────────────────────────────────────────────────────────────────
  async searchFTS(
    query: string,
    page: number,
    limit: number,
    scholar?: string,
    intentSubject?: string,
    semanticExpansions?: string[],
  ): Promise<{ data: SearchResult[]; total: number; aggregations: any }> {
    this.logger.log('FTS Query Started');
    const offset = (page - 1) * limit;

    // Build tsquery: use intent subject + semantic expansions in OR logic
    const subjectForTs = intentSubject && intentSubject.length >= 2 ? intentSubject : query;
    const expandedQuery = await this.synonymService.getExpandedTsQuery(subjectForTs);

    if (!expandedQuery) {
      return { data: [], total: 0, aggregations: { scholars: {} } };
    }

    // The phrase we ILIKE-match for phrase-boost scoring
    const phraseForMatch = intentSubject && intentSubject.length >= 2 ? intentSubject : query;

    const scholarFilter = scholar ? Prisma.sql`AND s.slug = ${scholar}` : Prisma.empty;

    // ── Main result query ──────────────────────────────────────────────────
    const rawQuery = Prisma.sql`
      SELECT
        f.id, f.slug, f.question, f.answer,
        s.name  AS scholar,
        s.slug  AS scholar_slug,
        c.name  AS category,
        src.name AS source,
        (
          -- Priority 1: intent subject exact match in question
          CASE WHEN ${phraseForMatch} <> '' AND f.question ILIKE '%' || ${phraseForMatch} || '%' THEN 7000 ELSE 0 END
          +
          -- Priority 2: full normalized query match in question (if different from subject)
          CASE WHEN ${query} <> ${phraseForMatch} AND f.question ILIKE '%' || ${query} || '%' THEN 5000 ELSE 0 END
          +
          -- Priority 3: intent subject in keywords
          CASE WHEN ${phraseForMatch} <> '' AND EXISTS(
            SELECT 1 FROM fatwa_keywords fk
            JOIN keywords k ON fk.keyword_id = k.id
            WHERE fk.fatwa_id = f.id AND k.word ILIKE '%' || ${phraseForMatch} || '%'
          ) THEN 3000 ELSE 0 END
          +
          -- Priority 4: intent subject in answer
          CASE WHEN ${phraseForMatch} <> '' AND f.answer ILIKE '%' || ${phraseForMatch} || '%' THEN 1500 ELSE 0 END
          +
          -- Priority 5: ts_rank_cd
          (ts_rank_cd('{0.1, 0.2, 0.4, 1.0}', si.search_vector, to_tsquery('arabic', ${expandedQuery})) * 100)
        ) AS score
      FROM fatawa f
      JOIN search_index si ON f.id = si.fatwa_id
      JOIN scholars  s   ON f.scholar_id  = s.id
      JOIN categories c  ON f.category_id = c.id
      JOIN sources   src ON f.source_id   = src.id
      WHERE si.search_vector @@ to_tsquery('arabic', ${expandedQuery})
        AND f.verification_status = 'verified'
        ${scholarFilter}
      ORDER BY score DESC, f.id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // ── Count query ────────────────────────────────────────────────────────
    const countQuery = Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM fatawa f
      JOIN search_index si ON f.id = si.fatwa_id
      JOIN scholars  s   ON f.scholar_id = s.id
      WHERE si.search_vector @@ to_tsquery('arabic', ${expandedQuery})
        AND f.verification_status = 'verified'
        ${scholarFilter}
    `;

    // ── Aggregation query (always without scholar filter) ──────────────────
    const aggQuery = Prisma.sql`
      SELECT s.slug, COUNT(*)::int AS count
      FROM fatawa f
      JOIN search_index si ON f.id = si.fatwa_id
      JOIN scholars  s   ON f.scholar_id = s.id
      WHERE si.search_vector @@ to_tsquery('arabic', ${expandedQuery})
        AND f.verification_status = 'verified'
      GROUP BY s.slug
    `;

    const [data, countResult, aggResult] = await Promise.all([
      this.prisma.$queryRaw<SearchResult[]>(rawQuery),
      this.prisma.$queryRaw<{ total: number }[]>(countQuery),
      this.prisma.$queryRaw<{ slug: string; count: number }[]>(aggQuery),
    ]);

    const total = Number(countResult[0]?.total || 0);

    const mappedData = (data as any[]).map(item => ({
      ...item,
      questionTitle: item.question ? item.question.substring(0, 80) + '...' : '',
    }));

    const aggregations: { scholars: Record<string, number> } = { scholars: {} };
    if (aggResult) {
      aggResult.forEach(row => {
        aggregations.scholars[row.slug] = Number(row.count);
      });
    }

    return { data: mappedData, total, aggregations };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Fallback (ILIKE-based) with intent-aware scoring
  // Respects SEARCH_FALLBACK_MAX_CANDIDATES (default 500)
  // ─────────────────────────────────────────────────────────────────────────
  async searchFallback(
    query: string,
    page: number,
    limit: number,
    scholar?: string,
    intentSubject?: string,
  ): Promise<{ data: SearchResult[]; total: number; aggregations: any }> {
    const phraseForMatch = intentSubject && intentSubject.length >= 2 ? intentSubject : query;
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
      ],
    }));

    const limitCandidates =
      parseInt(process.env.SEARCH_FALLBACK_MAX_CANDIDATES as any, 10) || 500;

    try {
      const rawData = await this.prisma.fatwa.findMany({
        where: {
          AND: [{ verificationStatus: 'verified' }, ...searchConditions],
        },
        include: { scholar: true, category: true, source: true },
        take: limitCandidates,
      });

      const scoredData = rawData.map(fatwa => {
        let score = 0;
        const lowerPhrase = phraseForMatch.toLowerCase();
        const lowerQuery = query.toLowerCase();

        // Priority 1 – intent subject exact match in question
        if (fatwa.question?.toLowerCase().includes(lowerPhrase)) score += 7000;
        // Priority 2 – full query in question
        if (lowerPhrase !== lowerQuery && fatwa.question?.toLowerCase().includes(lowerQuery)) score += 5000;
        // Priority 3 – intent subject in answer
        if (fatwa.answer?.toLowerCase().includes(lowerPhrase)) score += 1500;

        // Word-level boosts
        terms.forEach(term => {
          const lt = term.toLowerCase();
          if (fatwa.question?.toLowerCase().includes(lt)) score += 80;
          if (fatwa.answer?.toLowerCase().includes(lt)) score += 20;
        });

        // Metadata boosts
        if (fatwa.scholar?.name?.toLowerCase().includes(lowerQuery)) score += 40;
        if (fatwa.category?.name?.toLowerCase().includes(lowerQuery)) score += 50;

        return {
          id: fatwa.id,
          slug: fatwa.slug,
          questionTitle: fatwa.question ? fatwa.question.substring(0, 80) + '...' : '',
          question: fatwa.question || '',
          answer: fatwa.answer || '',
          scholar: fatwa.scholar?.name || 'غير معروف',
          category: fatwa.category?.name || 'غير مصنف',
          source: fatwa.source?.name || 'غير معروف',
          _scholarSlug: fatwa.scholar?.slug,
          score,
        };
      });

      scoredData.sort((a, b) => b.score - a.score);

      // Aggregations (before scholar filter)
      const aggregations: { scholars: Record<string, number> } = { scholars: {} };
      scoredData.forEach(d => {
        if (d._scholarSlug) {
          aggregations.scholars[d._scholarSlug] =
            (aggregations.scholars[d._scholarSlug] || 0) + 1;
        }
      });

      // Scholar filter
      const filteredData = scholar
        ? scoredData.filter(d => d._scholarSlug === scholar)
        : scoredData;

      const total = filteredData.length;
      const offset = (page - 1) * limit;
      const paginatedData = filteredData.slice(offset, offset + limit).map(({ _scholarSlug, ...rest }) => rest);

      return { data: paginatedData, total, aggregations };
    } catch (e: any) {
      this.logger.error(`Fallback exception: ${e.name} – ${e.message}`);
      throw e;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Autocomplete
  // ─────────────────────────────────────────────────────────────────────────
  async autocomplete(q: string, scholar?: string) {
    const questions = await this.prisma.fatwa.findMany({
      where: {
        question: { contains: q, mode: Prisma.QueryMode.insensitive },
        verificationStatus: 'verified',
        ...(scholar ? { scholar: { slug: scholar } } : {}),
      },
      select: { question: true },
      take: 5,
    });

    const keywords = await this.prisma.keyword.findMany({
      where: { word: { startsWith: q, mode: Prisma.QueryMode.insensitive } },
      select: { word: true },
      take: 3,
    });

    const synonyms = await this.prisma.synonym.findMany({
      where: { word: { startsWith: q, mode: Prisma.QueryMode.insensitive } },
      select: { word: true },
      take: 3,
    });

    const categories = await this.prisma.category.findMany({
      where: { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
      select: { name: true },
      take: 3,
    });

    const scholars = await this.prisma.scholar.findMany({
      where: { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
      select: { name: true },
      take: 2,
    });

    const suggestions = new Set<string>();
    questions.forEach(f => suggestions.add(f.question.substring(0, 60)));
    keywords.forEach(k => suggestions.add(k.word));
    synonyms.forEach(s => suggestions.add(s.word));
    categories.forEach(c => suggestions.add(c.name));
    scholars.forEach(s => suggestions.add(`فتاوى ${s.name}`));

    return Array.from(suggestions)
      .slice(0, 10)
      .map(term => ({ term }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────────────
  async logSearch(query: string, resultsCount: number, executionMs: number, engine: string) {
    try {
      await this.prisma.searchLog.create({
        data: { query, resultsCount, executionMs },
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
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { _count: { query: 'desc' } },
      take: 10,
    });

    return result.map(r => r.query);
  }

  async getAllSynonyms() {
    return this.prisma.synonym.findMany({ orderBy: { word: 'asc' } });
  }

  async rebuildSearchIndex() {
    this.logger.log('Rebuilding PostgreSQL Search Index…');
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO search_index (fatwa_id, normalized_text, updated_at)
        SELECT
          f.id,
          concat_ws(' ', f.question, f.answer, s.name, c.name),
          NOW()
        FROM fatawa f
        LEFT JOIN scholars   s ON f.scholar_id  = s.id
        LEFT JOIN categories c ON f.category_id = c.id
        ON CONFLICT (fatwa_id) DO UPDATE SET
          normalized_text = EXCLUDED.normalized_text,
          updated_at = NOW();
      `);

      await this.prisma.$executeRawUnsafe(`
        UPDATE search_index si
        SET search_vector =
          setweight(to_tsvector('arabic',
            coalesce(f.question, '') || ' ' ||
            coalesce((
              SELECT string_agg(k.word, ' ')
              FROM fatwa_keywords fk
              JOIN keywords k ON fk.keyword_id = k.id
              WHERE fk.fatwa_id = f.id
            ), '')
          ), 'A') ||
          setweight(to_tsvector('arabic',
            coalesce(s.name, '') || ' ' || coalesce(c.name, '')
          ), 'B') ||
          setweight(to_tsvector('arabic', coalesce(f.answer, '')), 'C')
        FROM fatawa f
        LEFT JOIN scholars   s ON f.scholar_id  = s.id
        LEFT JOIN categories c ON f.category_id = c.id
        WHERE f.id = si.fatwa_id;
      `);

      this.logger.log('Search Index rebuilt successfully.');
    } catch (error: any) {
      this.logger.error(`Failed to rebuild search index: ${error.message}`);
    }
  }

  async rebuildSearchIndexForSource(sourceId: string) {
    this.logger.log(`Rebuilding search index for source: ${sourceId}…`);
    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO search_index (fatwa_id, normalized_text, updated_at)
        SELECT
          f.id,
          concat_ws(' ', f.question, f.answer, s.name, c.name),
          NOW()
        FROM fatawa f
        LEFT JOIN scholars   s ON f.scholar_id  = s.id
        LEFT JOIN categories c ON f.category_id = c.id
        WHERE f.source_id = '${sourceId}'
        ON CONFLICT (fatwa_id) DO UPDATE SET
          normalized_text = EXCLUDED.normalized_text,
          updated_at = NOW();
      `);

      await this.prisma.$executeRawUnsafe(`
        UPDATE search_index si
        SET search_vector =
          setweight(to_tsvector('arabic',
            coalesce(f.question, '') || ' ' ||
            coalesce((
              SELECT string_agg(k.word, ' ')
              FROM fatwa_keywords fk
              JOIN keywords k ON fk.keyword_id = k.id
              WHERE fk.fatwa_id = f.id
            ), '')
          ), 'A') ||
          setweight(to_tsvector('arabic',
            coalesce(s.name, '') || ' ' || coalesce(c.name, '')
          ), 'B') ||
          setweight(to_tsvector('arabic', coalesce(f.answer, '')), 'C')
        FROM fatawa f
        LEFT JOIN scholars   s ON f.scholar_id  = s.id
        LEFT JOIN categories c ON f.category_id = c.id
        WHERE f.id = si.fatwa_id AND f.source_id = '${sourceId}';
      `);

      this.logger.log(`Search Index rebuilt for source: ${sourceId}`);
    } catch (error: any) {
      this.logger.error(`Failed to rebuild search index for source: ${error.message}`);
    }
  }
}
