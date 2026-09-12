import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditLog');

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId ?? null,
          userEmail: entry.userEmail ?? null,
          action: entry.action,
          resourceType: entry.resourceType ?? null,
          resourceId: entry.resourceId ?? null,
          oldValues: entry.oldValues ?? undefined,
          newValues: entry.newValues ?? undefined,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
        },
      });
    } catch (err) {
      // Không để lỗi ghi nhật ký làm hỏng luồng chính
      this.logger.error(`Không ghi được audit log: ${(err as Error).message}`);
    }
  }
}
