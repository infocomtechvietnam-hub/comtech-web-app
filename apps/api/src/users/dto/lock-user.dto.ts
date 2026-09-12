import { IsOptional, IsString } from 'class-validator';

export class LockUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
