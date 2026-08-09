import { FatawaService } from './fatawa.service';
export declare class FatawaController {
    private readonly fatawaService;
    constructor(fatawaService: FatawaService);
    getFatawa(scholarSlug: string, scholarId: string, page?: string, limit?: string): Promise<{
        data: ({
            category: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
                createdAt: Date;
            };
            source: {
                id: string;
                name: string;
                slug: string;
                createdAt: Date;
                type: string;
                officialUrl: string | null;
                licenseNotes: string | null;
            };
            scholar: {
                id: string;
                name: string;
                slug: string;
                createdAt: Date;
                description: string | null;
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
        category: {
            id: string;
            name: string;
            slug: string;
            parentId: string | null;
            createdAt: Date;
        };
        source: {
            id: string;
            name: string;
            slug: string;
            createdAt: Date;
            type: string;
            officialUrl: string | null;
            licenseNotes: string | null;
        };
        scholar: {
            id: string;
            name: string;
            slug: string;
            createdAt: Date;
            description: string | null;
        };
        attachments: {
            id: string;
            createdAt: Date;
            type: string;
            fatwaId: string;
            title: string | null;
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
