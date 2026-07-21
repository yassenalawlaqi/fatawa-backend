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
        createdAt: Date;
        name: string;
        description: string | null;
    })[]>;
}
