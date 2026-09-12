import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const departments = await this.prisma.department.findMany({
      where: { deletedAt: null },
      include: {
        manager: { select: { id: true, code: true, fullName: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { code: 'asc' },
    });

    return departments.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description,
      parentId: d.parentId,
      manager: d.manager,
      employeeCount: d._count.employees,
    }));
  }
}
