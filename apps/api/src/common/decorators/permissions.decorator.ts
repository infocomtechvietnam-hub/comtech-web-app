import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
/**
 * Yêu cầu người dùng có ít nhất một trong các quyền.
 * Định dạng "resource:action" (không kèm scope — chỉ cần có quyền ở bất kỳ scope nào).
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
