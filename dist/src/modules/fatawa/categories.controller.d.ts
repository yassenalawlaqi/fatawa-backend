import { FatawaService } from './fatawa.service';
export declare class CategoriesController {
    private readonly fatawaService;
    constructor(fatawaService: FatawaService);
    getCategories(): Promise<{
        id: string;
        slug: string;
        createdAt: Date;
        name: string;
    }[]>;
}
