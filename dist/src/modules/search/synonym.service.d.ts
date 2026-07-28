import { PrismaService } from '../prisma/prisma.service';
export declare class SynonymService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    expandQuery(query: string): Promise<string[]>;
    getExpandedTsQuery(query: string): Promise<string>;
}
