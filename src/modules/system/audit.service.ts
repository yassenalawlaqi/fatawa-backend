import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async logAction(action: string, entity: string, entityId: string, details?: string) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          entity,
          entityId,
          details,
        }
      });
    } catch (error) {
      this.logger.error(`Failed to log audit action: ${action}`, error);
    }
  }
}
