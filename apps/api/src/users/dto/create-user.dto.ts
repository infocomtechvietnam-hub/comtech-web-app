import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { RoleName } from '@comtech/types';

const ROLE_NAMES: RoleName[] = [
  'admin',
  'manager',
  'employee',
  'hr',
  'hr_manager',
];

export class CreateUserDto {
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  password: string;

  @IsString({ message: 'Vui lòng nhập họ tên.' })
  @MinLength(2, { message: 'Họ tên quá ngắn.' })
  fullName: string;

  @IsIn(ROLE_NAMES, { message: 'Vai trò không hợp lệ.' })
  roleName: RoleName;

  @IsOptional()
  @IsUUID('4', { message: 'Phòng ban không hợp lệ.' })
  departmentId?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;
}
