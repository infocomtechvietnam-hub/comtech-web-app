import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  email: string;

  @IsString({ message: 'Mật khẩu không hợp lệ.' })
  @MinLength(1, { message: 'Vui lòng nhập mật khẩu.' })
  password: string;

  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  email: string;
}

export class ResetPasswordDto {
  @IsString({ message: 'Token không hợp lệ.' })
  token: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' })
  newPassword: string;
}
