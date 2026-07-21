"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SearchRepository_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SearchRepository = SearchRepository_1 = class SearchRepository {
    prisma;
    logger = new common_1.Logger(SearchRepository_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async search(query, page = 1, limit = 20) {
        this.logger.log('Repository Started');
        try {
            const ftsResult = await this.searchFTS(query, page, limit);
            if (ftsResult.total > 0) {
                return { ...ftsResult, engine: 'fts' };
            }
            this.logger.log('FTS returned 0 results, trying fallback...');
            const fallbackResult = await this.searchFallback(query, page, limit);
            return { ...fallbackResult, engine: fallbackResult.total > 0 ? 'fallback' : 'fts' };
        }
        catch (error) {
            this.logger.warn(`FTS query failed, falling back to basic search: ${error.message}`);
            const fallbackResult = await this.searchFallback(query, page, limit);
            return { ...fallbackResult, engine: 'fallback' };
        }
    }
    async searchFTS(query, page, limit) {
        this.logger.log('FTS Query Started');
        const offset = (page - 1) * limit;
        const rawQuery = client_1.Prisma.sql `
      SELECT 
        f.id, f.slug, f.question, f.answer, 
        s.name as scholar, c.name as category, src.name as source,
        ts_rank(si.search_vector, plainto_tsquery('arabic', ${query})) as score
      FROM fatawa f
      JOIN search_index si ON f.id = si.fatwa_id
      JOIN scholars s ON f.scholar_id = s.id
      JOIN categories c ON f.category_id = c.id
      JOIN sources src ON f.source_id = src.id
      WHERE si.search_vector @@ plainto_tsquery('arabic', ${query})
        AND f.verification_status = 'verified'
      ORDER BY score DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
        const countQuery = client_1.Prisma.sql `
      SELECT COUNT(*)::int as total
      FROM fatawa f
      JOIN search_index si ON f.id = si.fatwa_id
      WHERE si.search_vector @@ plainto_tsquery('arabic', ${query})
        AND f.verification_status = 'verified'
    `;
        this.logger.log('COUNT Query Started');
        const [data, countResult] = await Promise.all([
            this.prisma.$queryRaw(rawQuery),
            this.prisma.$queryRaw(countQuery)
        ]);
        this.logger.log(`typeof countResult[0]?.total: ${typeof countResult[0]?.total}`);
        const total = Number(countResult[0]?.total || 0);
        const mappedData = data.map(item => ({
            ...item,
            questionTitle: item.question.substring(0, 80) + '...',
        }));
        return { data: mappedData, total };
    }
    async searchFallback(query, page, limit) {
        const terms = query.split(' ').filter(t => t.length > 1);
        if (terms.length === 0) {
            return { data: [], total: 0 };
        }
        const searchConditions = terms.map(term => ({
            OR: [
                { question: { contains: term, mode: client_1.Prisma.QueryMode.insensitive } },
                { answer: { contains: term, mode: client_1.Prisma.QueryMode.insensitive } },
                { scholar: { name: { contains: term, mode: client_1.Prisma.QueryMode.insensitive } } },
                { category: { name: { contains: term, mode: client_1.Prisma.QueryMode.insensitive } } },
            ]
        }));
        try {
            const rawData = await this.prisma.fatwa.findMany({
                where: {
                    AND: [
                        { verificationStatus: 'verified' },
                        ...searchConditions
                    ]
                },
                include: { scholar: true, category: true, source: true },
                take: 50
            });
            const scoredData = rawData.map(fatwa => {
                let score = 0;
                const lowerQuery = query.toLowerCase();
                if (fatwa.question?.toLowerCase().includes(lowerQuery))
                    score += 100;
                if (fatwa.scholar?.name?.toLowerCase().includes(lowerQuery))
                    score += 70;
                if (fatwa.category?.name?.toLowerCase().includes(lowerQuery))
                    score += 50;
                terms.forEach(term => {
                    const lowerTerm = term.toLowerCase();
                    if (fatwa.question?.toLowerCase().includes(lowerTerm))
                        score += 40;
                    if (fatwa.answer?.toLowerCase().includes(lowerTerm))
                        score += 20;
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
            const total = scoredData.length;
            const offset = (page - 1) * limit;
            const paginatedData = scoredData.slice(offset, offset + limit);
            return { data: paginatedData, total };
        }
        catch (e) {
            this.logger.error(`Exception Name: ${e.name}`);
            this.logger.error(`Message: ${e.message}`);
            this.logger.error(`Stack: ${e.stack}`);
            throw e;
        }
    }
    async autocomplete(q) {
        const rawData = await this.prisma.fatwa.findMany({
            where: {
                verificationStatus: 'verified',
                OR: [
                    { question: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } },
                    { scholar: { name: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } } },
                    { category: { name: { contains: q, mode: client_1.Prisma.QueryMode.insensitive } } },
                ]
            },
            select: { question: true, scholar: { select: { name: true } }, category: { select: { name: true } } },
            take: 10
        });
        const suggestions = new Set();
        rawData.forEach(f => {
            if (f.question.toLowerCase().includes(q.toLowerCase())) {
                suggestions.add(f.question.substring(0, 50));
            }
            else if (f.scholar.name.toLowerCase().includes(q.toLowerCase())) {
                suggestions.add(`فتاوى ${f.scholar.name}`);
            }
            else if (f.category.name.toLowerCase().includes(q.toLowerCase())) {
                suggestions.add(f.category.name);
            }
        });
        return Array.from(suggestions).map(term => ({ term }));
    }
    async logSearch(query, resultsCount, executionMs, engine) {
        try {
            await this.prisma.searchLog.create({
                data: {
                    query,
                    resultsCount,
                    executionMs,
                }
            });
        }
        catch (e) {
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
        SELECT id, question || ' ' || answer, NOW()
        FROM fatawa
        ON CONFLICT (fatwa_id) DO UPDATE SET 
          normalized_text = EXCLUDED.normalized_text,
          updated_at = NOW();
      `);
            await this.prisma.$executeRawUnsafe(`
        UPDATE search_index
        SET search_vector = to_tsvector('arabic', normalized_text);
      `);
            this.logger.log('Search Index rebuilt successfully.');
        }
        catch (error) {
            this.logger.error(`Failed to rebuild search index: ${error.message}`);
        }
    }
};
exports.SearchRepository = SearchRepository;
exports.SearchRepository = SearchRepository = SearchRepository_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchRepository);
//# sourceMappingURL=search.repository.js.map