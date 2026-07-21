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
        return this.prisma.fatwa.findFirst({
            where: isUuid ? { id: slugOrId } : { slug: slugOrId },
            include: {
                scholar: true,
                category: true,
                source: true,
                attachments: true
            }
        });
    }
    async findRelated(slug, limit = 5) {
        return this.prisma.fatwa.findMany({
            where: {
                slug: { not: slug },
                verificationStatus: 'verified'
            },
            take: limit,
            include: {
                scholar: true,
                category: true,
            },
            orderBy: { publishedAt: 'desc' }
        });
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
        return this.prisma.category.findMany({
            orderBy: { name: 'asc' }
        });
    }
};
exports.FatawaRepository = FatawaRepository;
exports.FatawaRepository = FatawaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FatawaRepository);
//# sourceMappingURL=fatawa.repository.js.map