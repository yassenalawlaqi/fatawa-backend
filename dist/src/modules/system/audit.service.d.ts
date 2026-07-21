import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    logAction(action: string, entity: string, entityId: string, details?: string): Promise<void>;
}
