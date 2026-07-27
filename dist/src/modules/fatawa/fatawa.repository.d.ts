import { PrismaService } from '../prisma/prisma.service';
export declare class FatawaRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findBySlug(slugOrId: string): Promise<({
        scholar: {
            id: string;
            slug: string;
            name: string;
            description: string | null;
            createdAt: Date;
        };
        category: {
            id: string;
            slug: string;
            name: string;
            createdAt: Date;
        };
        source: {
            id: string;
            slug: string;
            name: string;
            createdAt: Date;
            type: string;
            officialUrl: string | null;
            licenseNotes: string | null;
        };
        attachments: {
            id: string;
            createdAt: Date;
            type: string;
            title: string | null;
            fatwaId: string;
            fileUrl: string;
        }[];
    } & {
        id: string;
        slug: string;
        createdAt: Date;
        officialUrl: string | null;
        sourceFingerprint: string;
        scholarId: string;
        categoryId: string;
        sourceId: string;
        question: string;
        answer: string;
        sourceBook: string | null;
        volume: string | null;
        page: string | null;
        publishedAt: Date | null;
        updatedAt: Date;
        verificationStatus: string;
        verifiedAt: Date | null;
        verifiedBy: string | null;
        syncStatus: string;
    }) | null>;
    findRelated(slug: string, limit?: number): Promise<({
        scholar: {
            id: string;
            slug: string;
            name: string;
            description: string | null;
            createdAt: Date;
        };
        category: {
            id: string;
            slug: string;
            name: string;
            createdAt: Date;
        };
    } & {
        id: string;
        slug: string;
        createdAt: Date;
        officialUrl: string | null;
        sourceFingerprint: string;
        scholarId: string;
        categoryId: string;
        sourceId: string;
        question: string;
        answer: string;
        sourceBook: string | null;
        volume: string | null;
        page: string | null;
        publishedAt: Date | null;
        updatedAt: Date;
        verificationStatus: string;
        verifiedAt: Date | null;
        verifiedBy: string | null;
        syncStatus: string;
    })[]>;
    findByScholar(scholarSlug: string | null, scholarId: string | null, page?: number, limit?: number): Promise<{
        data: ({
            scholar: {
                id: string;
                slug: string;
                name: string;
                description: string | null;
                createdAt: Date;
            };
            category: {
                id: string;
                slug: string;
                name: string;
                createdAt: Date;
            };
            source: {
                id: string;
                slug: string;
                name: string;
                createdAt: Date;
                type: string;
                officialUrl: string | null;
                licenseNotes: string | null;
            };
        } & {
            id: string;
            slug: string;
            createdAt: Date;
            officialUrl: string | null;
            sourceFingerprint: string;
            scholarId: string;
            categoryId: string;
            sourceId: string;
            question: string;
            answer: string;
            sourceBook: string | null;
            volume: string | null;
            page: string | null;
            publishedAt: Date | null;
            updatedAt: Date;
            verificationStatus: string;
            verifiedAt: Date | null;
            verifiedBy: string | null;
            syncStatus: string;
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
        name: string;
        description: string | null;
        createdAt: Date;
    })[]>;
    getCategories(): Promise<{
        id: string;
        slug: string;
        name: string;
        createdAt: Date;
    }[]>;
}
