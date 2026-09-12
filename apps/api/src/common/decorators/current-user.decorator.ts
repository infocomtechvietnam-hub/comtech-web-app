import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

/** Lấy thông tin người dùng hiện tại từ request (đã qua JwtAuthGuard) */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RequestUser;
    return data ? user?.[data] : user;
  },
);
