import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import {
  CurrentUser,
  RequestUser,
} from '../common/decorators/current-user.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // GET /api/customers — danh sách (phân trang, tìm kiếm, lọc)
  @Get()
  @RequirePermissions('customers:read')
  findAll(@Query() query: QueryCustomerDto) {
    return this.customersService.findAll(query);
  }

  // GET /api/customers/stats — thống kê theo trạng thái
  @Get('stats')
  @RequirePermissions('customers:read')
  stats() {
    return this.customersService.stats();
  }

  // GET /api/customers/assignees — danh sách nhân viên để phân công
  @Get('assignees')
  @RequirePermissions('customers:read')
  assignees() {
    return this.customersService.assignees();
  }

  // GET /api/customers/:id — chi tiết
  @Get(':id')
  @RequirePermissions('customers:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  // POST /api/customers — tạo mới
  @Post()
  @RequirePermissions('customers:create')
  create(@Body() dto: CreateCustomerDto, @CurrentUser() user: RequestUser) {
    return this.customersService.create(dto, user.userId);
  }

  // PATCH /api/customers/:id — cập nhật
  @Patch(':id')
  @RequirePermissions('customers:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  // DELETE /api/customers/:id — xoá mềm
  @Delete(':id')
  @RequirePermissions('customers:delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.remove(id);
  }
}
