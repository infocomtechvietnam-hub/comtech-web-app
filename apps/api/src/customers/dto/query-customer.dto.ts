import { IsIn, IsOptional, IsString } from 'class-validator';
import type { CustomerStatus, CustomerType } from '@comtech/types';

const CUSTOMER_TYPES: CustomerType[] = ['company', 'individual'];
const CUSTOMER_STATUSES: CustomerStatus[] = [
  'lead',
  'prospect',
  'active',
  'inactive',
];

/**
 * Tham số lọc/tìm kiếm/phân trang cho danh sách khách hàng.
 */
export class QueryCustomerDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;

  /** Từ khoá tìm kiếm (tên, mã, email, sđt, người liên hệ). */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(CUSTOMER_STATUSES, { message: 'Trạng thái không hợp lệ.' })
  status?: CustomerStatus;

  @IsOptional()
  @IsIn(CUSTOMER_TYPES, { message: 'Loại khách hàng không hợp lệ.' })
  type?: CustomerType;

  /** Lọc theo người phụ trách (id nhân viên). */
  @IsOptional()
  @IsString()
  assignedToId?: string;

  /** Sắp xếp: createdAt | name | code (mặc định createdAt desc). */
  @IsOptional()
  @IsIn(['createdAt', 'name', 'code'])
  sortBy?: 'createdAt' | 'name' | 'code';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
