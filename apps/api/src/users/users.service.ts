import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ROLE_PERMISSIONS } from '../common/permissions';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private mapUser(u: any) {
    return {
      id: u.id,
      email: u.email,
      isActive: u.isActive,
      isLocked: u.isLocked,
      lockedReason: u.lockedReason,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      roles: u.userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        displayName: ur.role.displayName,
      })),
      employee: u.employee
        ? {
            id: u.employee.id,
            code: u.employee.code,
            fullName: u.employee.fullName,
            avatarUrl: u.employee.avatarUrl,
            jobTitle: u.employee.jobTitle,
            departmentId: u.employee.departmentId,
            status: u.employee.status,
          }
        : null,
    };
  }

  async findAll(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        include: {
          userRoles: { include: { role: true } },
          employee: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return {
      data: rows.map((u) => this.mapUser(u)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        userRoles: { include: { role: true } },
        employee: { include: { department: true } },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
    return this.mapUser(user);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
        employee: { include: { department: true } },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permSet = new Set<string>();
    for (const r of roles) (ROLE_PERMISSIONS[r] ?? []).forEach((p) => permSet.add(p));

    return {
      id: user.id,
      email: user.email,
      fullName: user.employee?.fullName ?? user.email,
      avatarUrl: user.employee?.avatarUrl ?? null,
      roles,
      permissions: Array.from(permSet),
      employee: user.employee
        ? {
            id: user.employee.id,
            code: user.employee.code,
            fullName: user.employee.fullName,
            avatarUrl: user.employee.avatarUrl,
            jobTitle: user.employee.jobTitle,
            departmentId: user.employee.departmentId,
            department: user.employee.department
              ? {
                  id: user.employee.department.id,
                  code: user.employee.department.code,
                  name: user.employee.department.name,
                }
              : null,
            status: user.employee.status,
          }
        : null,
    };
  }

  private async nextEmployeeCode(): Promise<string> {
    const last = await this.prisma.employee.findFirst({
      orderBy: { code: 'desc' },
      where: { code: { startsWith: 'NV-' } },
    });
    const n = last ? parseInt(last.code.replace('NV-', ''), 10) + 1 : 1;
    return `NV-${String(n).padStart(4, '0')}`;
  }

  async create(dto: CreateUserDto, actorId?: string, actorEmail?: string) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) {
      throw new ConflictException('Email này đã được sử dụng.');
    }

    const role = await this.prisma.role.findUnique({
      where: { name: dto.roleName },
    });
    if (!role) throw new BadRequestException('Vai trò không tồn tại.');

    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!dept) throw new BadRequestException('Phòng ban không tồn tại.');
    }

    const cost = Number(process.env.BCRYPT_COST ?? 12);
    const passwordHash = await bcrypt.hash(dto.password, cost);
    const code = await this.nextEmployeeCode();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        userRoles: {
          create: { roleId: role.id, assignedBy: actorId ?? null },
        },
        employee: {
          create: {
            code,
            fullName: dto.fullName,
            jobTitle: dto.jobTitle ?? null,
            departmentId: dto.departmentId ?? null,
            workEmail: dto.email,
            status: 'active',
          },
        },
      },
      include: {
        userRoles: { include: { role: true } },
        employee: true,
      },
    });

    await this.audit.log({
      userId: actorId ?? null,
      userEmail: actorEmail ?? null,
      action: 'create',
      resourceType: 'users',
      resourceId: user.id,
      newValues: { email: dto.email, role: dto.roleName, code },
    });

    return this.mapUser(user);
  }

  async lock(id: string, reason: string | undefined, actorId?: string, actorEmail?: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');
    if (actorId && actorId === id) {
      throw new BadRequestException('Bạn không thể tự khóa tài khoản của mình.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isLocked: true,
        lockedAt: new Date(),
        lockedReason: reason ?? 'Khóa thủ công bởi quản trị viên',
      },
      include: { userRoles: { include: { role: true } }, employee: true },
    });

    await this.audit.log({
      userId: actorId ?? null,
      userEmail: actorEmail ?? null,
      action: 'lock_account',
      resourceType: 'users',
      resourceId: id,
      newValues: { reason: reason ?? 'Khóa thủ công' },
    });

    return this.mapUser(updated);
  }

  async unlock(id: string, actorId?: string, actorEmail?: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản.');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isLocked: false,
        lockedAt: null,
        lockedReason: null,
        failedAttempts: 0,
      },
      include: { userRoles: { include: { role: true } }, employee: true },
    });

    await this.audit.log({
      userId: actorId ?? null,
      userEmail: actorEmail ?? null,
      action: 'unlock_account',
      resourceType: 'users',
      resourceId: id,
    });

    return this.mapUser(updated);
  }
}
