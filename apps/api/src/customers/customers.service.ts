import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  private mapCustomer(c: any) {
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      type: c.type,
      contactPerson: c.contactPerson,
      email: c.email,
      phone: c.phone,
      taxCode: c.taxCode,
      website: c.website,
      industry: c.industry,
      source: c.source,
      status: c.status,
      address: c.address,
      city: c.city,
      notes: c.notes,
      assignedToId: c.assignedToId,
      assignedTo: c.assignedTo
        ? {
            id: c.assignedTo.id,
            code: c.assignedTo.code,
            fullName: c.assignedTo.fullName,
            avatarUrl: c.assignedTo.avatarUrl,
            jobTitle: c.assignedTo.jobTitle,
          }
        : null,
      createdById: c.createdById,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }

  /** Sinh mã khách hàng tiếp theo dạng KH-0001 */
  private async nextCustomerCode(): Promise<string> {
    const last = await this.prisma.customer.findFirst({
      where: { code: { startsWith: 'KH-' } },
      orderBy: { code: 'desc' },
    });
    const n = last ? parseInt(last.code.replace('KH-', ''), 10) + 1 : 1;
    return `KH-${String(n).padStart(4, '0')}`;
  }

  async findAll(query: QueryCustomerDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 20, 1), 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.CustomerWhereInput = { deletedAt: null };

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.assignedToId) where.assignedToId = query.assignedToId;

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
        { contactPerson: { contains: term, mode: 'insensitive' } },
        { taxCode: { contains: term, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const orderBy: Prisma.CustomerOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        include: { assignedTo: true },
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: rows.map((c) => this.mapCustomer(c)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: { assignedTo: true },
    });
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng.');
    return this.mapCustomer(customer);
  }

  private async validateAssignee(assignedToId?: string) {
    if (!assignedToId) return;
    const emp = await this.prisma.employee.findUnique({
      where: { id: assignedToId },
    });
    if (!emp) throw new BadRequestException('Người phụ trách không tồn tại.');
  }

  async create(dto: CreateCustomerDto, createdById?: string) {
    await this.validateAssignee(dto.assignedToId);
    const code = await this.nextCustomerCode();

    const customer = await this.prisma.customer.create({
      data: {
        code,
        name: dto.name,
        type: dto.type,
        contactPerson: dto.contactPerson ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        taxCode: dto.taxCode ?? null,
        website: dto.website ?? null,
        industry: dto.industry ?? null,
        source: dto.source ?? null,
        status: dto.status ?? 'lead',
        address: dto.address ?? null,
        city: dto.city ?? null,
        notes: dto.notes ?? null,
        assignedToId: dto.assignedToId ?? null,
        createdById: createdById ?? null,
      },
      include: { assignedTo: true },
    });

    return this.mapCustomer(customer);
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const existing = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy khách hàng.');

    if (dto.assignedToId !== undefined) {
      await this.validateAssignee(dto.assignedToId);
    }

    const data: Prisma.CustomerUpdateInput = {};
    const assignable: (keyof UpdateCustomerDto)[] = [
      'name',
      'type',
      'contactPerson',
      'email',
      'phone',
      'taxCode',
      'website',
      'industry',
      'source',
      'status',
      'address',
      'city',
      'notes',
    ];
    for (const key of assignable) {
      if (dto[key] !== undefined) {
        (data as any)[key] = dto[key] === '' ? null : dto[key];
      }
    }
    if (dto.assignedToId !== undefined) {
      data.assignedTo = dto.assignedToId
        ? { connect: { id: dto.assignedToId } }
        : { disconnect: true };
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data,
      include: { assignedTo: true },
    });

    return this.mapCustomer(updated);
  }

  /** Xoá mềm khách hàng (đặt deletedAt) */
  async remove(id: string) {
    const existing = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy khách hàng.');

    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: 'Đã xóa khách hàng.' };
  }

  /** Danh sách nhân viên có thể phân công phụ trách khách hàng */
  async assignees() {
    const employees = await this.prisma.employee.findMany({
      where: { archivedAt: null },
      select: {
        id: true,
        code: true,
        fullName: true,
        avatarUrl: true,
        jobTitle: true,
      },
      orderBy: { fullName: 'asc' },
    });
    return employees;
  }

  /** Thống kê nhanh theo trạng thái (phục vụ dashboard/bộ lọc) */
  async stats() {
    const grouped = await this.prisma.customer.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    const byStatus: Record<string, number> = {
      lead: 0,
      prospect: 0,
      active: 0,
      inactive: 0,
    };
    let total = 0;
    for (const g of grouped) {
      byStatus[g.status] = g._count._all;
      total += g._count._all;
    }
    return { total, byStatus };
  }
}
