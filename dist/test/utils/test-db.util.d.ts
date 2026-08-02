import { PrismaClient } from '@prisma/client';
export declare class TestDbUtil {
    private static prisma;
    static wipeDatabase(): Promise<void>;
    static getPrismaClient(): PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
