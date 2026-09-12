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
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { QueryDealDto } from './dto/query-deal.dto';
import { MoveStageDto } from './dto/move-stage.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import {
  CurrentUser,
  RequestUser,
} from '../common/decorators/current-user.decorator';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  // GET /api/deals — danh sách (phân trang, tìm kiếm, lọc)
  @Get()
  @RequirePermissions('opportunities:read')
  findAll(@Query() query: QueryDealDto) {
    return this.dealsService.findAll(query);
  }

  // GET /api/deals/pipeline — dữ liệu Kanban theo giai đoạn
  @Get('pipeline')
  @RequirePermissions('opportunities:read')
  pipeline(@Query() query: QueryDealDto) {
    return this.dealsService.pipeline(query);
  }

  // GET /api/deals/stats — thống kê (funnel, dự báo doanh thu)
  @Get('stats')
  @RequirePermissions('opportunities:read')
  stats() {
    return this.dealsService.stats();
  }

  // GET /api/deals/assignees — danh sách nhân viên để phân công
  @Get('assignees')
  @RequirePermissions('opportunities:read')
  assignees() {
    return this.dealsService.assignees();
  }

  // GET /api/deals/customers — danh sách khách hàng gọn cho dropdown
  @Get('customers')
  @RequirePermissions('opportunities:read')
  customers(@Query('search') search?: string) {
    return this.dealsService.customers(search);
  }

  // GET /api/deals/:id — chi tiết (kèm lịch sử hoạt động)
  @Get(':id')
  @RequirePermissions('opportunities:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dealsService.findOne(id);
  }

  // GET /api/deals/:id/activities — lịch sử hoạt động
  @Get(':id/activities')
  @RequirePermissions('opportunities:read')
  activities(@Param('id', ParseUUIDPipe) id: string) {
    return this.dealsService.activities(id);
  }

  // POST /api/deals — tạo mới
  @Post()
  @RequirePermissions('opportunities:create')
  create(@Body() dto: CreateDealDto, @CurrentUser() user: RequestUser) {
    return this.dealsService.create(dto, user.userId);
  }

  // POST /api/deals/:id/activities — thêm hoạt động / ghi chú
  @Post(':id/activities')
  @RequirePermissions('opportunities:update')
  addActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.dealsService.addActivity(id, dto, user.userId);
  }

  // PATCH /api/deals/:id — cập nhật
  @Patch(':id')
  @RequirePermissions('opportunities:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.dealsService.update(id, dto, user.userId);
  }

  // PATCH /api/deals/:id/stage — chuyển giai đoạn (kéo thả Kanban)
  @Patch(':id/stage')
  @RequirePermissions('opportunities:update')
  moveStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveStageDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.dealsService.moveStage(id, dto, user.userId);
  }

  // DELETE /api/deals/:id — xoá mềm
  @Delete(':id')
  @RequirePermissions('opportunities:delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.dealsService.remove(id);
  }
}
