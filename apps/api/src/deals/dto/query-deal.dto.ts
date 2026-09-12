import { IsIn, IsOptional, IsString } from 'class-validator';
import type { DealStage, DealStatus } from '@comtech/types';
import { DEAL_STAGES } from './create-deal.dto';

const DEAL_STATUSES: DealStatus[] = ['open', 'won', 'lost'];

/**
 * Tham số lọc/tìm kiếm/phân trang cho danh sách cơ hội.
 */
export class QueryDealDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;

  /** Từ khoá tìm kiếm (tên, mã cơ hội, tên/mã khách hàng). */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(DEAL_STAGES, { message: 'Giai đoạn không hợp lệ.' })
  stage?: DealStage;

  @IsOptional()
  @IsIn(DEAL_STATUSES, { message: 'Trạng thái không hợp lệ.' })
  status?: DealStatus;

  /** Lọc theo người phụ trách (id nhân viên). */
  @IsOptional()
  @IsString()
  assignedToId?: string;

  /** Lọc theo khách hàng. */
  @IsOptional()
  @IsString()
  customerId?: string;

  /** Giá trị tối thiểu. */
  @IsOptional()
  @IsString()
  minValue?: string;

  /** Giá trị tối đa. */
  @IsOptional()
  @IsString()
  maxValue?: string;

  /** Sắp xếp: createdAt | value | expectedCloseDate | probability | name. */
  @IsOptional()
  @IsIn(['createdAt', 'value', 'expectedCloseDate', 'probability', 'name'])
  sortBy?: 'createdAt' | 'value' | 'expectedCloseDate' | 'probability' | 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
