import { FatawaService } from './fatawa.service';
export declare class CategoriesController {
    private readonly fatawaService;
    constructor(fatawaService: FatawaService);
    getCategories(): Promise<any[]>;
}
