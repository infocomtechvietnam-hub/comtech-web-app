import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { QueryDealDto } from './dto/query-deal.dto';
import { MoveStageDto } from './dto/move-stage.dto';
import { CreateActivityDto } from './dto/create-activity.dto';

/** Danh sách stage đang mở (chưa đóng) theo thứ tự phễu bán hàng */
const OPEN_STAGES = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
];
const ALL_STAGES = [...OPEN_STAGES, 'closed_won', 'closed_lost'];

/** Xác suất mặc định gợi ý theo từng stage (%) */
const STAGE_PROBABILITY: Record<string, number> = {
  prospecting: 10,
  qualification: 25,
  proposal: 50,
  negotiation: 75,
  closed_won: 100,
  closed_lost: 0,
};

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  private statusFromStage(stage: string): 'open' | 'won' | 'lost' {
    if (stage === 'closed_won') return 'won';
    if (stage === 'closed_lost') return 'lost';
    return 'open';
  }

  private mapDeal(d: any) {
    return {
      id: d.id,
      code: d.code,
      name: d.name,
      customerId: d.customerId,
      customer: d.customer
        ? {
            id: d.customer.id,
            code: d.customer.code,
            name: d.customer.name,
            type: d.customer.type,
          }
        : null,
      value: d.value != null ? Number(d.value) : 0,
      currency: d.currency,
      probability: d.probability,
      stage: d.stage,
      status: d.status,
      source: d.source,
      expectedCloseDate: d.expectedCloseDate,
      closedAt: d.closedAt,
      lostReason: d.lostReason,
      description: d.description,
      assignedToId: d.assignedToId,
      assignedTo: d.assignedTo
        ? {
            id: d.assignedTo.id,
            code: d.assignedTo.code,
            fullName: d.assignedTo.fullName,
            avatarUrl: d.assignedTo.avatarUrl,
            jobTitle: d.assignedTo.jobTitle,
          }
        : null,
      createdById: d.createdById,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      activities: d.activities
        ? d.activities.map((a: any) => this.mapActivity(a))
        : undefined,
    };
  }

  private mapActivity(a: any) {
    return {
      id: a.id,
      dealId: a.dealId,
      type: a.type,
      content: a.content,
      fromStage: a.fromStage,
      toStage: a.toStage,
      createdById: a.createdById,
      createdByName: a.createdBy?.employee?.fullName ?? a.createdBy?.email ?? null,
      createdAt: a.createdAt,
    };
  }

  /** Sinh mã cơ hội tiếp theo dạng CH-0001 */
  private async nextDealCode(): Promise<string> {
    const last = await this.prisma.deal.findFirst({
      where: { code: { startsWith: 'CH-' } },
      orderBy: { code: 'desc' },
    });
    const n = last ? parseInt(last.code.replace('CH-', ''), 10) + 1 : 1;
    return `CH-${String(n).padStart(4, '0')}`;
  }

  private async validateCustomer(customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null },
    });
    if (!customer) throw new BadRequestException('Khách hàng không tồn tại.');
    return customer;
  }

  private async validateAssignee(assignedToId?: string) {
    if (!assignedToId) return;
    const emp = await this.prisma.employee.findUnique({
      where: { id: assignedToId },
    });
    if (!emp) throw new BadRequestException('Người phụ trách không tồn tại.');
  }

  private buildWhere(query: QueryDealDto): Prisma.DealWhereInput {
    const where: Prisma.DealWhereInput = { deletedAt: null };
    if (query.stage) where.stage = query.stage;
    if (query.status) where.status = query.status;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.customerId) where.customerId = query.customerId;

    const min = query.minValue ? Number(query.minValue) : undefined;
    const max = query.maxValue ? Number(query.maxValue) : undefined;
    if (
      (min !== undefined && !Number.isNaN(min)) ||
      (max !== undefined && !Number.isNaN(max))
    ) {
      where.value = {};
      if (min !== undefined && !Number.isNaN(min)) where.value.gte = min;
      if (max !== undefined && !Number.isNaN(max)) where.value.lte = max;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { customer: { is: { name: { contains: term, mode: 'insensitive' } } } },
        { customer: { is: { code: { contains: term, mode: 'insensitive' } } } },
      ];
    }
    return where;
  }

  async findAll(query: QueryDealDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 20, 1), 100);
    const skip = (page - 1) * pageSize;

    const where = this.buildWhere(query);
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';
    const orderBy: Prisma.DealOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where,
        include: { customer: true, assignedTo: true },
        orderBy,
        skip,
        take: pageSize,
      }),
      this.prisma.deal.count({ where }),
    ]);

    return {
      data: rows.map((d) => this.mapDeal(d)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  /** Pipeline dạng Kanban: nhóm cơ hội đang mở theo từng stage */
  async pipeline(query: QueryDealDto) {
    const where = this.buildWhere({ ...query, stage: undefined });

    const rows = await this.prisma.deal.findMany({
      where,
      include: { customer: true, assignedTo: true },
      orderBy: { updatedAt: 'desc' },
    });

    const columns = ALL_STAGES.map((stage) => {
      const deals = rows
        .filter((d) => d.stage === stage)
        .map((d) => this.mapDeal(d));
      const value = deals.reduce((sum, d) => sum + (d.value || 0), 0);
      return { stage, count: deals.length, value, deals };
    });

    return columns;
  }

  async findOne(id: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        assignedTo: true,
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { include: { employee: true } } },
        },
      },
    });
    if (!deal) throw new NotFoundException('Không tìm thấy cơ hội.');
    return this.mapDeal(deal);
  }

  async create(dto: CreateDealDto, createdById?: string) {
    await this.validateCustomer(dto.customerId);
    await this.validateAssignee(dto.assignedToId);

    const code = await this.nextDealCode();
    const stage = dto.stage ?? 'prospecting';
    const status = this.statusFromStage(stage);
    const probability =
      dto.probability ?? STAGE_PROBABILITY[stage] ?? 0;

    const deal = await this.prisma.deal.create({
      data: {
        code,
        name: dto.name,
        customerId: dto.customerId,
        value: dto.value ?? 0,
        probability,
        stage,
        status,
        source: dto.source ?? null,
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : null,
        closedAt: status !== 'open' ? new Date() : null,
        description: dto.description ?? null,
        assignedToId: dto.assignedToId ?? null,
        createdById: createdById ?? null,
        activities: {
          create: {
            type: 'created',
            content: 'Đã tạo cơ hội bán hàng',
            toStage: stage,
            createdById: createdById ?? null,
          },
        },
      },
      include: { customer: true, assignedTo: true },
    });

    return this.mapDeal(deal);
  }

  async update(id: string, dto: UpdateDealDto, userId?: string) {
    const existing = await this.prisma.deal.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy cơ hội.');

    if (dto.customerId !== undefined) {
      await this.validateCustomer(dto.customerId);
    }
    if (dto.assignedToId !== undefined) {
      await this.validateAssignee(dto.assignedToId);
    }

    const data: Prisma.DealUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.probability !== undefined) data.probability = dto.probability;
    if (dto.source !== undefined) data.source = dto.source || null;
    if (dto.description !== undefined)
      data.description = dto.description || null;
    if (dto.lostReason !== undefined)
      data.lostReason = dto.lostReason || null;
    if (dto.expectedCloseDate !== undefined) {
      data.expectedCloseDate = dto.expectedCloseDate
        ? new Date(dto.expectedCloseDate)
        : null;
    }
    if (dto.customerId !== undefined) {
      data.customer = { connect: { id: dto.customerId } };
    }
    if (dto.assignedToId !== undefined) {
      data.assignedTo = dto.assignedToId
        ? { connect: { id: dto.assignedToId } }
        : { disconnect: true };
    }

    // Nếu đổi stage qua update -> đồng bộ status/closedAt và ghi lịch sử
    let stageChanged = false;
    if (dto.stage !== undefined && dto.stage !== existing.stage) {
      stageChanged = true;
      const status = this.statusFromStage(dto.stage);
      data.stage = dto.stage;
      data.status = status;
      data.closedAt = status !== 'open' ? new Date() : null;
      if (dto.probability === undefined && dto.stage === 'closed_won')
        data.probability = 100;
      if (dto.probability === undefined && dto.stage === 'closed_lost')
        data.probability = 0;
    }

    const updated = await this.prisma.deal.update({
      where: { id },
      data,
      include: { customer: true, assignedTo: true },
    });

    if (stageChanged) {
      await this.prisma.dealActivity.create({
        data: {
          dealId: id,
          type: 'stage_change',
          content: 'Cập nhật giai đoạn cơ hội',
          fromStage: existing.stage,
          toStage: dto.stage,
          createdById: userId ?? null,
        },
      });
    }

    return this.mapDeal(updated);
  }

  /** Chuyển cơ hội sang giai đoạn khác (kéo thả Kanban) + ghi lịch sử */
  async moveStage(id: string, dto: MoveStageDto, userId?: string) {
    const existing = await this.prisma.deal.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy cơ hội.');

    if (dto.stage === existing.stage) {
      return this.findOne(id);
    }

    const status = this.statusFromStage(dto.stage);
    const data: Prisma.DealUpdateInput = {
      stage: dto.stage,
      status,
      closedAt: status !== 'open' ? new Date() : null,
    };
    if (dto.stage === 'closed_won') data.probability = 100;
    if (dto.stage === 'closed_lost') {
      data.probability = 0;
      data.lostReason = dto.lostReason ?? existing.lostReason ?? null;
    }

    await this.prisma.$transaction([
      this.prisma.deal.update({ where: { id }, data }),
      this.prisma.dealActivity.create({
        data: {
          dealId: id,
          type: 'stage_change',
          content:
            dto.stage === 'closed_lost' && dto.lostReason
              ? `Chuyển sang "Thất bại": ${dto.lostReason}`
              : 'Chuyển giai đoạn cơ hội',
          fromStage: existing.stage,
          toStage: dto.stage,
          createdById: userId ?? null,
        },
      }),
    ]);

    return this.findOne(id);
  }

  /** Thêm hoạt động / ghi chú cho cơ hội */
  async addActivity(id: string, dto: CreateActivityDto, userId?: string) {
    const existing = await this.prisma.deal.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy cơ hội.');

    await this.prisma.dealActivity.create({
      data: {
        dealId: id,
        type: dto.type,
        content: dto.content,
        createdById: userId ?? null,
      },
    });

    return this.findOne(id);
  }

  /** Danh sách hoạt động của một cơ hội */
  async activities(id: string) {
    const existing = await this.prisma.deal.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy cơ hội.');

    const rows = await this.prisma.dealActivity.findMany({
      where: { dealId: id },
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { include: { employee: true } } },
    });
    return rows.map((a) => this.mapActivity(a));
  }

  /** Xoá mềm cơ hội */
  async remove(id: string) {
    const existing = await this.prisma.deal.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy cơ hội.');

    await this.prisma.deal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true, message: 'Đã xóa cơ hội.' };
  }

  /** Danh sách nhân viên có thể phân công phụ trách cơ hội */
  async assignees() {
    return this.prisma.employee.findMany({
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
  }

  /** Danh sách khách hàng gọn (phục vụ dropdown chọn khách hàng cho cơ hội) */
  async customers(search?: string) {
    const where: Prisma.CustomerWhereInput = { deletedAt: null };
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
      ];
    }
    return this.prisma.customer.findMany({
      where,
      select: { id: true, code: true, name: true, type: true },
      orderBy: { name: 'asc' },
      take: 200,
    });
  }

  /** Thống kê tổng hợp cơ hội (dashboard, funnel, dự báo doanh thu) */
  async stats() {
    const grouped = await this.prisma.deal.groupBy({
      by: ['stage'],
      where: { deletedAt: null },
      _count: { _all: true },
      _sum: { value: true },
    });

    const byStage = ALL_STAGES.map((stage) => {
      const g = grouped.find((x) => x.stage === stage);
      return {
        stage,
        count: g?._count._all ?? 0,
        value: g?._sum.value ? Number(g._sum.value) : 0,
      };
    });

    // Cơ hội đang mở (để tính giá trị & dự báo có trọng số)
    const openDeals = await this.prisma.deal.findMany({
      where: { deletedAt: null, status: 'open' },
      select: { value: true, probability: true },
    });
    const totalOpen = openDeals.length;
    const totalOpenValue = openDeals.reduce(
      (s, d) => s + (d.value ? Number(d.value) : 0),
      0,
    );
    const weightedForecast = openDeals.reduce(
      (s, d) => s + (d.value ? Number(d.value) : 0) * (d.probability / 100),
      0,
    );

    const won = byStage.find((s) => s.stage === 'closed_won')!;
    const lost = byStage.find((s) => s.stage === 'closed_lost')!;
    const closedTotal = won.count + lost.count;
    const conversionRate =
      closedTotal > 0 ? Math.round((won.count / closedTotal) * 100) : 0;

    return {
      totalOpen,
      totalOpenValue,
      wonCount: won.count,
      wonValue: won.value,
      lostCount: lost.count,
      conversionRate,
      weightedForecast: Math.round(weightedForecast),
      byStage,
    };
  }
}
