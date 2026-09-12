import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { DealSource, DealStage } from '@comtech/types';
import { DEAL_SOURCES, DEAL_STAGES } from './create-deal.dto';

/**
 * DTO cập nhật cơ hội — tất cả trường đều tùy chọn (PATCH).
 */
export class UpdateDealDto {
  @IsOptional()
  @IsString({ message: 'Vui lòng nhập tên cơ hội.' })
  @MinLength(2, { message: 'Tên cơ hội quá ngắn.' })
  @MaxLength(255, { message: 'Tên cơ hội quá dài.' })
  name?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Khách hàng không hợp lệ.' })
  customerId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá trị cơ hội không hợp lệ.' })
  @Min(0, { message: 'Giá trị cơ hội không được âm.' })
  value?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Xác suất phải là số nguyên.' })
  @Min(0, { message: 'Xác suất tối thiểu là 0%.' })
  @Max(100, { message: 'Xác suất tối đa là 100%.' })
  probability?: number;

  @IsOptional()
  @IsIn(DEAL_STAGES, { message: 'Giai đoạn không hợp lệ.' })
  stage?: DealStage;

  @IsOptional()
  @IsIn(DEAL_SOURCES, { message: 'Nguồn cơ hội không hợp lệ.' })
  source?: DealSource;

  @IsOptional()
  @IsISO8601({}, { message: 'Ngày đóng dự kiến không hợp lệ.' })
  expectedCloseDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Lý do thất bại quá dài.' })
  lostReason?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Người phụ trách không hợp lệ.' })
  assignedToId?: string;
}
