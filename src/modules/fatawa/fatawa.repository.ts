import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FatawaRepository {
  constructor(private prisma: PrismaService) {}

  async findBySlug(slugOrId: string) {
    // Support lookup by both slug and UUID id
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

  async findRelated(slug: string, limit: number = 5) {
    // In a real app, this might use semantic search. Here we fetch latest verified.
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

  async findByScholar(scholarSlug: string | null, scholarId: string | null, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    let where: any = { verificationStatus: 'verified' };
    
    if (scholarId) {
      where.scholarId = scholarId;
    } else if (scholarSlug) {
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
}
