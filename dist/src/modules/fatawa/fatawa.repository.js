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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FatawaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FatawaRepository = class FatawaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findBySlug(slugOrId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
        const where = isUuid ? { id: slugOrId } : { slug: slugOrId };
        const fatwa = await this.prisma.fatwa.findFirst({
            where,
            include: {
                scholar: true,
                category: true,
                source: true,
                attachments: true,
                keywords: {
                    include: { keyword: true }
                }
            }
        });
        if (fatwa) {
            await this.prisma.fatwa.update({
                where: { id: fatwa.id },
                data: { viewCount: { increment: 1 } }
            });
        }
        return fatwa;
    }
    async findRelated(slug, limit = 5) {
        const baseFatwa = await this.findBySlug(slug);
        if (!baseFatwa)
            return [];
        const keywordIds = baseFatwa.keywords.map(k => `'${k.keywordId}'`);
        const kwFilter = keywordIds.length > 0
            ? `(SELECT COALESCE(COUNT(*), 0) * 10 FROM fatwa_keywords fk WHERE fk.fatwa_id = f.id AND fk.keyword_id IN (${keywordIds.join(',')}))`
            : `0`;
        const rawQuery = `
      SELECT 
        f.id, f.slug, f.question, 
        s.name as scholar, c.name as category,
        (
          (CASE WHEN f.category_id = '${baseFatwa.categoryId}' THEN 30 ELSE 0 END) +
          (CASE WHEN f.scholar_id = '${baseFatwa.scholarId}' THEN 20 ELSE 0 END) +
          ${kwFilter}
        ) as score
      FROM fatawa f
      JOIN scholars s ON f.scholar_id = s.id
      JOIN categories c ON f.category_id = c.id
      WHERE f.id != '${baseFatwa.id}' AND f.verification_status = 'verified'
      ORDER BY score DESC, f.published_at DESC
      LIMIT ${limit}
    `;
        const related = await this.prisma.$queryRawUnsafe(rawQuery);
        return related;
    }
    async findByScholar(scholarSlug, scholarId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        let where = { verificationStatus: 'verified' };
        if (scholarId) {
            where.scholarId = scholarId;
        }
        else if (scholarSlug) {
            where.scholar = { slug: scholarSlug };
        }
        const [data, total] = await Promise.all([
            this.prisma.fatwa.findMany({
                where,
                skip,
                take: limit,
                include: { category: true, scholar: true, source: true },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.fatwa.count({ where })
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async getScholars() {
        return this.prisma.scholar.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { fatawa: true } }
            }
        });
    }
    async getCategories() {
        const categories = await this.prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
        const categoryMap = new Map();
        categories.forEach(c => categoryMap.set(c.id, { ...c, children: [] }));
        const rootCategories = [];
        categories.forEach(c => {
            if (c.parentId) {
                const parent = categoryMap.get(c.parentId);
                if (parent) {
                    parent.children.push(categoryMap.get(c.id));
                }
                else {
                    rootCategories.push(categoryMap.get(c.id));
                }
            }
            else {
                rootCategories.push(categoryMap.get(c.id));
            }
        });
        return rootCategories;
    }
};
exports.FatawaRepository = FatawaRepository;
exports.FatawaRepository = FatawaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FatawaRepository);
//# sourceMappingURL=fatawa.repository.js.map