import { PrismaService } from '../prisma/prisma.service';
export declare class FatawaRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findBySlug(slugOrId: string): Promise<({
        scholar: {
            id: string;
            slug: string;
            createdAt: Date;
            name: string;
            description: string | null;
        };
        category: {
            id: string;
            slug: string;
            createdAt: Date;
            name: string;
        };
        source: {
            id: string;
            slug: string;
            officialUrl: string | null;
            createdAt: Date;
            name: string;
            type: string;
            licenseNotes: string | null;
        };
        attachments: {
            id: string;
            createdAt: Date;
            type: string;
            title: string | null;
            fileUrl: string;
            fatwaId: string;
        }[];
    } & {
        syncStatus: string;
        answer: string;
        question: string;
        id: string;
        slug: string;
        scholarId: string;
        categoryId: string;
        sourceId: string;
        sourceBook: string | null;
        volume: string | null;
        page: string | null;
        officialUrl: string | null;
        sourceFingerprint: string;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        verificationStatus: string;
        verifiedAt: Date | null;
        verifiedBy: string | null;
    }) | null>;
    findRelated(slug: string, limit?: number): Promise<({
        scholar: {
            id: string;
            slug: string;
            createdAt: Date;
            name: string;
            description: string | null;
        };
        category: {
            id: string;
            slug: string;
            createdAt: Date;
            name: string;
        };
    } & {
        syncStatus: string;
        answer: string;
        question: string;
        id: string;
        slug: string;
        scholarId: string;
        categoryId: string;
        sourceId: string;
        sourceBook: string | null;
        volume: string | null;
        page: string | null;
        officialUrl: string | null;
        sourceFingerprint: string;
        publishedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        verificationStatus: string;
        verifiedAt: Date | null;
        verifiedBy: string | null;
    })[]>;
    findByScholar(scholarSlug: string | null, scholarId: string | null, page?: number, limit?: number): Promise<{
        data: ({
            scholar: {
                id: string;
                slug: string;
                createdAt: Date;
                name: string;
                description: string | null;
            };
            category: {
                id: string;
                slug: string;
                createdAt: Date;
                name: string;
            };
            source: {
                id: string;
                slug: string;
                officialUrl: string | null;
                createdAt: Date;
                name: string;
                type: string;
                licenseNotes: string | null;
            };
        } & {
            syncStatus: string;
            answer: string;
            question: string;
            id: string;
            slug: string;
            scholarId: string;
            categoryId: string;
            sourceId: string;
            sourceBook: string | null;
            volume: string | null;
            page: string | null;
            officialUrl: string | null;
            sourceFingerprint: string;
            publishedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            verificationStatus: string;
            verifiedAt: Date | null;
            verifiedBy: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getScholars(): Promise<({
        _count: {
            fatawa: number;
        };
    } & {
        id: string;
        slug: string;
        createdAt: Date;
        name: string;
        description: string | null;
    })[]>;
    getCategories(): Promise<{
        id: string;
        slug: string;
        createdAt: Date;
        name: string;
    }[]>;
}
