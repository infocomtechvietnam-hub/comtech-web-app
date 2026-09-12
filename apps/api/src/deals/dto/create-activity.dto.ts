import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import type { DealActivityType } from '@comtech/types';

const ACTIVITY_TYPES: DealActivityType[] = [
  'note',
  'call',
  'email',
  'meeting',
  'task',
];

/**
 * DTO thêm hoạt động / ghi chú cho cơ hội.
 */
export class CreateActivityDto {
  @IsIn(ACTIVITY_TYPES, { message: 'Loại hoạt động không hợp lệ.' })
  type: DealActivityType;

  @IsString({ message: 'Vui lòng nhập nội dung.' })
  @MinLength(1, { message: 'Nội dung không được để trống.' })
  @MaxLength(2000, { message: 'Nội dung quá dài.' })
  content: string;
}
