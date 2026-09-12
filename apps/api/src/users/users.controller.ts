import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LockUserDto } from './dto/lock-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import {
  CurrentUser,
  RequestUser,
} from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/users/me — thông tin người dùng hiện tại (mọi vai trò đã đăng nhập)
  @Get('me')
  getMe(@CurrentUser() user: RequestUser) {
    return this.usersService.getMe(user.userId);
  }

  // GET /api/users — Admin only
  @Get()
  @Roles('admin')
  @RequirePermissions('users:read')
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.usersService.findAll(
      Number(page) || 1,
      Number(pageSize) || 20,
    );
  }

  @Get(':id')
  @Roles('admin')
  @RequirePermissions('users:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  // POST /api/users — Admin only
  @Post()
  @Roles('admin')
  @RequirePermissions('users:create')
  create(@Body() dto: CreateUserDto, @CurrentUser() user: RequestUser) {
    return this.usersService.create(dto, user.userId, user.email);
  }

  // PATCH /api/users/:id/lock — Admin only
  @Patch(':id/lock')
  @Roles('admin')
  @RequirePermissions('users:update')
  lock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LockUserDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.usersService.lock(id, dto.reason, user.userId, user.email);
  }

  // PATCH /api/users/:id/unlock — Admin only
  @Patch(':id/unlock')
  @Roles('admin')
  @RequirePermissions('users:update')
  unlock(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.usersService.unlock(id, user.userId, user.email);
  }
}
