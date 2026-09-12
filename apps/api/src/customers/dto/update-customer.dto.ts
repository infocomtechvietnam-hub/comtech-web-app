import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import type {
  CustomerSource,
  CustomerStatus,
  CustomerType,
} from '@comtech/types';

const CUSTOMER_TYPES: CustomerType[] = ['company', 'individual'];
const CUSTOMER_STATUSES: CustomerStatus[] = [
  'lead',
  'prospect',
  'active',
  'inactive',
];
const CUSTOMER_SOURCES: CustomerSource[] = [
  'website',
  'referral',
  'event',
  'cold_call',
  'social',
  'other',
];

/**
 * Cập nhật khách hàng — tất cả các trường đều tuỳ chọn.
 */
export class UpdateCustomerDto {
  @IsOptional()
  @IsString({ message: 'Vui lòng nhập tên khách hàng.' })
  @MinLength(2, { message: 'Tên khách hàng quá ngắn.' })
  @MaxLength(255, { message: 'Tên khách hàng quá dài.' })
  name?: string;

  @IsOptional()
  @IsIn(CUSTOMER_TYPES, { message: 'Loại khách hàng không hợp lệ.' })
  type?: CustomerType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactPerson?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Số điện thoại quá dài.' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  industry?: string;

  @IsOptional()
  @IsIn(CUSTOMER_SOURCES, { message: 'Nguồn khách hàng không hợp lệ.' })
  source?: CustomerSource;

  @IsOptional()
  @IsIn(CUSTOMER_STATUSES, { message: 'Trạng thái không hợp lệ.' })
  status?: CustomerStatus;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Người phụ trách không hợp lệ.' })
  assignedToId?: string;
}
