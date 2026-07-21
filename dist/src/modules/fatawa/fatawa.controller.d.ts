import { FatawaService } from './fatawa.service';
export declare class FatawaController {
    private readonly fatawaService;
    constructor(fatawaService: FatawaService);
    getFatawa(scholarSlug: string, scholarId: string, page?: string, limit?: string): Promise<{
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
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getFatwa(slug: string): Promise<{
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
    }>;
    getRelated(slug: string): Promise<({
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
}
