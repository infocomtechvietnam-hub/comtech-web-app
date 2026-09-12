import { SetMetadata } from '@nestjs/common';
import { RoleName } from '@comtech/types';

export const ROLES_KEY = 'roles';
/** Yêu cầu người dùng có ít nhất một trong các vai trò */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
