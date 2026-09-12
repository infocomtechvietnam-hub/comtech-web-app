import { Controller, Get } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  // GET /api/departments — mọi vai trò đều có quyền xem (departments:read)
  @Get()
  @RequirePermissions('departments:read')
  findAll() {
    return this.departmentsService.findAll();
  }
}
