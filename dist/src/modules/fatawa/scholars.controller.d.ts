import { FatawaService } from './fatawa.service';
export declare class ScholarsController {
    private readonly fatawaService;
    constructor(fatawaService: FatawaService);
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
}
