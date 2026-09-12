import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';
import { RequestUser } from '../decorators/current-user.decorator';

/**
 * Tự động ghi nhật ký cho các thao tác thay đổi dữ liệu (POST/PATCH/PUT/DELETE).
 * Login/logout được ghi thủ công trong AuthService để lưu cả trường hợp thất bại.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly writeMethods = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

  // Map URL → (resourceType, action) để mô tả hành động bằng nhật ký
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;

    // Bỏ qua GET và các endpoint auth (đã tự ghi trong AuthService)
    const url: string = req.originalUrl ?? req.url ?? '';
    const isAuthRoute = url.includes('/auth/');

    if (!this.writeMethods.has(method) || isAuthRoute) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody) => {
        const user = req.user as RequestUser | undefined;
        const resourceType = this.extractResource(url);
        const action = this.mapAction(method);
        void this.audit.log({
          userId: user?.userId ?? null,
          userEmail: user?.email ?? null,
          action,
          resourceType,
          resourceId: this.extractId(responseBody, req),
          newValues: this.sanitize(req.body),
          ipAddress: this.getIp(req),
          userAgent: req.headers?.['user-agent'] ?? null,
        });
      }),
    );
  }

  private extractResource(url: string): string {
    const clean = url.replace(/^\/api\//, '');
    const parts = clean.split('/').filter(Boolean);
    return parts[0] ?? 'unknown';
  }

  private mapAction(method: string): string {
    switch (method) {
      case 'POST':
        return 'create';
      case 'PATCH':
      case 'PUT':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return method.toLowerCase();
    }
  }

  private extractId(body: any, req: any): string | null {
    if (req.params?.id) return req.params.id;
    if (body && typeof body === 'object' && 'id' in body) return body.id;
    return null;
  }

  private sanitize(body: any): any {
    if (!body || typeof body !== 'object') return body;
    const clone = { ...body };
    for (const k of ['password', 'newPassword', 'passwordHash', 'token']) {
      if (k in clone) clone[k] = '***';
    }
    return clone;
  }

  private getIp(req: any): string | null {
    return (
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.ip ??
      req.socket?.remoteAddress ??
      null
    );
  }
}
