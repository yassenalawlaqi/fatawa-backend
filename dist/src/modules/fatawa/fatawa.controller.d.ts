import { FatawaService } from './fatawa.service';
export declare class FatawaController {
    private readonly fatawaService;
    constructor(fatawaService: FatawaService);
    getFatawa(scholarSlug: string, scholarId: string, page?: string, limit?: string): Promise<{
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
                parentId: string | null;
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
            viewCount: number;
            publishedAt: Date | null;
            updatedAt: Date;
            verificationStatus: string;
            verifiedAt: Date | null;
            verifiedBy: string | null;
            syncStatus: string;
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
            name: string;
            description: string | null;
            createdAt: Date;
        };
        category: {
            id: string;
            slug: string;
            name: string;
            createdAt: Date;
            parentId: string | null;
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
        keywords: ({
            keyword: {
                id: string;
                word: string;
            };
        } & {
            id: string;
            fatwaId: string;
            keywordId: string;
        })[];
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
        viewCount: number;
        publishedAt: Date | null;
        updatedAt: Date;
        verificationStatus: string;
        verifiedAt: Date | null;
        verifiedBy: string | null;
        syncStatus: string;
    }>;
    getRelated(slug: string): Promise<any[]>;
}
