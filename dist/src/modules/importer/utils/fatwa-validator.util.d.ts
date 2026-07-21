import { FatwaData } from '../interfaces/i-importer.interface';
export declare class FatwaValidator {
    private static readonly logger;
    static validate(data: FatwaData): {
        isValid: boolean;
        errors: string[];
    };
}
