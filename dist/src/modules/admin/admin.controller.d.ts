import { ImporterService } from '../importer/importer.service';
export declare class AdminController {
    private readonly importerService;
    constructor(importerService: ImporterService);
    runImport(sourceSlug?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getSyncStatus(): Promise<{
        success: boolean;
        message: string;
    }>;
}
