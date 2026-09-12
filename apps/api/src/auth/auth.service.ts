import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ROLE_PERMISSIONS } from '../common/permissions';

interface RequestMeta {
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  private readonly maxFailed = Number(process.env.MAX_FAILED_ATTEMPTS ?? 5);
  private readonly lockMinutes = Number(process.env.LOCK_DURATION_MINUTES ?? 15);
  private readonly resetTtlMin = Number(process.env.RESET_TOKEN_TTL_MINUTES ?? 30);
  private readonly accessExpires = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
  private readonly refreshExpires = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  // ---------- Helpers ----------

  private async buildAuthUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
        employee: { include: { department: true } },
      },
    });
    if (!user) throw new UnauthorizedException('Không tìm thấy người dùng.');

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permSet = new Set<string>();
    for (const r of roles) {
      (ROLE_PERMISSIONS[r] ?? []).forEach((p) => permSet.add(p));
    }
    const permissions = Array.from(permSet);

    return {
      user,
      roles,
      permissions,
      authUser: {
        id: user.id,
        email: user.email,
        fullName: user.employee?.fullName ?? user.email,
        avatarUrl: user.employee?.avatarUrl ?? null,
        roles,
        permissions,
        employee: user.employee
          ? {
              id: user.employee.id,
              code: user.employee.code,
              fullName: user.employee.fullName,
              avatarUrl: user.employee.avatarUrl,
              jobTitle: user.employee.jobTitle,
              departmentId: user.employee.departmentId,
              status: user.employee.status as any,
            }
          : null,
      },
    };
  }

  private signAccessToken(payload: {
    sub: string;
    email: string;
    roles: string[];
    permissions: string[];
  }) {
    return this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: this.accessExpires,
    });
  }

  private async issueRefreshToken(userId: string): Promise<string> {
    const raw = crypto.randomBytes(48).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const days = 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
    // token gửi cho client = userId.raw để tra cứu nhanh
    return `${userId}.${raw}`;
  }

  private parseAccessTtlSeconds(): number {
    // '15m' → 900
    const m = /^(\d+)([smhd])$/.exec(this.accessExpires);
    if (!m) return 900;
    const n = Number(m[1]);
    const unit = m[2];
    const mult = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
    return n * mult;
  }

  // ---------- Login ----------

  async login(email: string, password: string, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.deletedAt) {
      await this.audit.log({
        userEmail: email,
        action: 'login_failed',
        resourceType: 'auth',
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        newValues: { reason: 'Không tồn tại tài khoản' },
      });
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }

    // Kiểm tra khóa tài khoản
    if (user.isLocked) {
      // Nếu bị khóa tự động và đã hết thời gian → mở khóa
      const autoUnlock =
        user.lockedReason?.includes('tự động') &&
        user.lockedAt &&
        Date.now() - user.lockedAt.getTime() > this.lockMinutes * 60 * 1000;

      if (autoUnlock) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            isLocked: false,
            lockedAt: null,
            lockedReason: null,
            failedAttempts: 0,
          },
        });
      } else {
        await this.audit.log({
          userId: user.id,
          userEmail: email,
          action: 'login_failed',
          resourceType: 'auth',
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
          newValues: { reason: 'Tài khoản đang bị khóa' },
        });
        throw new UnauthorizedException(
          'Tài khoản của bạn đang bị khóa. Vui lòng thử lại sau hoặc liên hệ quản trị viên.',
        );
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedAttempts + 1;
      const shouldLock = attempts >= this.maxFailed;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: attempts,
          ...(shouldLock
            ? {
                isLocked: true,
                lockedAt: new Date(),
                lockedReason: `Khóa tự động do nhập sai mật khẩu ${this.maxFailed} lần`,
              }
            : {}),
        },
      });
      await this.audit.log({
        userId: user.id,
        userEmail: email,
        action: 'login_failed',
        resourceType: 'auth',
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        newValues: { attempts, locked: shouldLock },
      });

      if (shouldLock) {
        throw new UnauthorizedException(
          `Bạn đã nhập sai mật khẩu ${this.maxFailed} lần. Tài khoản bị khóa tạm thời ${this.lockMinutes} phút.`,
        );
      }
      const remaining = this.maxFailed - attempts;
      throw new UnauthorizedException(
        `Email hoặc mật khẩu không đúng. Bạn còn ${remaining} lần thử.`,
      );
    }

    // Đăng nhập thành công → reset failedAttempts, cập nhật last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lastLoginAt: new Date(),
        lastLoginIp: meta.ip ?? null,
      },
    });

    const { authUser, roles, permissions } = await this.buildAuthUser(user.id);
    const accessToken = this.signAccessToken({
      sub: user.id,
      email: user.email,
      roles,
      permissions,
    });
    const refreshToken = await this.issueRefreshToken(user.id);

    await this.audit.log({
      userId: user.id,
      userEmail: user.email,
      action: 'login',
      resourceType: 'auth',
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseAccessTtlSeconds(),
      user: authUser,
    };
  }

  // ---------- Refresh ----------

  async refresh(refreshTokenValue: string | undefined, meta: RequestMeta) {
    if (!refreshTokenValue || !refreshTokenValue.includes('.')) {
      throw new UnauthorizedException('Refresh token không hợp lệ.');
    }
    const [userId, raw] = refreshTokenValue.split('.');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (
      !stored ||
      stored.userId !== userId ||
      stored.revokedAt ||
      stored.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedException('Refresh token đã hết hạn hoặc không hợp lệ.');
    }

    // Xoay vòng refresh token (revoke cũ, cấp mới)
    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    const { authUser, roles, permissions } = await this.buildAuthUser(userId);
    const accessToken = this.signAccessToken({
      sub: userId,
      email: authUser.email,
      roles,
      permissions,
    });
    const newRefresh = await this.issueRefreshToken(userId);

    return {
      accessToken,
      refreshToken: newRefresh,
      expiresIn: this.parseAccessTtlSeconds(),
      user: authUser,
    };
  }

  // ---------- Logout ----------

  async logout(
    userId: string | undefined,
    email: string | undefined,
    refreshTokenValue: string | undefined,
    meta: RequestMeta,
  ) {
    if (refreshTokenValue && refreshTokenValue.includes('.')) {
      const raw = refreshTokenValue.split('.')[1];
      const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
      await this.prisma.refreshToken
        .updateMany({
          where: { tokenHash, revokedAt: null },
          data: { revokedAt: new Date() },
        })
        .catch(() => undefined);
    }
    await this.audit.log({
      userId: userId ?? null,
      userEmail: email ?? null,
      action: 'logout',
      resourceType: 'auth',
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });
    return { message: 'Đăng xuất thành công.' };
  }

  // ---------- Forgot / Reset password ----------

  async forgotPassword(email: string, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Luôn trả về thông báo giống nhau để tránh dò email
    const genericMessage =
      'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.';

    if (!user || user.deletedAt) {
      return { message: genericMessage };
    }

    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const expiresAt = new Date(Date.now() + this.resetTtlMin * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetLink = `${process.env.WEB_ORIGIN ?? 'http://localhost:3000'}/reset-password?token=${raw}`;

    // M1: chưa gửi email thật — log ra console
    this.logger.log('==================================================');
    this.logger.log(`[MOCK EMAIL] Đặt lại mật khẩu cho: ${email}`);
    this.logger.log(`[MOCK EMAIL] Link (hết hạn sau ${this.resetTtlMin} phút):`);
    this.logger.log(`[MOCK EMAIL] ${resetLink}`);
    this.logger.log('==================================================');

    await this.audit.log({
      userId: user.id,
      userEmail: email,
      action: 'forgot_password',
      resourceType: 'auth',
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });

    return { message: genericMessage };
  }

  async resetPassword(token: string, newPassword: string, meta: RequestMeta) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !record ||
      record.usedAt ||
      record.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      );
    }

    const cost = Number(process.env.BCRYPT_COST ?? 12);
    const passwordHash = await bcrypt.hash(newPassword, cost);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, failedAttempts: 0, isLocked: false, lockedAt: null, lockedReason: null },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Thu hồi toàn bộ refresh token cũ
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.audit.log({
      userId: record.userId,
      userEmail: record.user.email,
      action: 'reset_password',
      resourceType: 'auth',
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    });

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }
}
