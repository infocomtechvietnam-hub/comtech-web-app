/**
 * @comtech/types — Kiểu dữ liệu dùng chung giữa Web (Next.js) và API (NestJS).
 */

/** Tên các vai trò hệ thống */
export type RoleName = 'admin' | 'manager' | 'employee' | 'hr' | 'hr_manager';

/** Trạng thái làm việc của nhân viên */
export type EmployeeStatus = 'probation' | 'active' | 'on_leave' | 'resigned';

/** Giới tính */
export type Gender = 'male' | 'female' | 'other';

/** Phạm vi quyền */
export type PermissionScope = 'all' | 'own' | 'department';

export interface Role {
  id: string;
  name: RoleName;
  displayName: string;
  description?: string | null;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  scope: PermissionScope;
  description?: string | null;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  managerId?: string | null;
}

export interface EmployeeSummary {
  id: string;
  code: string;
  fullName: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  departmentId?: string | null;
  status: EmployeeStatus;
}

export interface UserSummary {
  id: string;
  email: string;
  isActive: boolean;
  isLocked: boolean;
  lockedReason?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  roles: Role[];
  employee?: EmployeeSummary | null;
}

/** Payload trả về cho /auth/login và /users/me */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  roles: RoleName[];
  permissions: string[]; // dạng "resource:action"
  employee?: EmployeeSummary | null;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number; // giây
  user: AuthUser;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  roleName: RoleName;
  departmentId?: string;
  jobTitle?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Cấu trúc lỗi API chuẩn (message tiếng Việt) */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
