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

/** ===================== M2 — Khách hàng ===================== */

/** Loại khách hàng */
export type CustomerType = 'company' | 'individual';

/** Trạng thái khách hàng trong quy trình bán hàng */
export type CustomerStatus = 'lead' | 'prospect' | 'active' | 'inactive';

/** Nguồn khách hàng */
export type CustomerSource =
  | 'website'
  | 'referral'
  | 'event'
  | 'cold_call'
  | 'social'
  | 'other';

/** Tóm tắt người phụ trách (nhân viên) gắn với khách hàng */
export interface CustomerAssignee {
  id: string;
  code: string;
  fullName: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  type: CustomerType;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  taxCode?: string | null;
  website?: string | null;
  industry?: string | null;
  source?: CustomerSource | null;
  status: CustomerStatus;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  assignedToId?: string | null;
  assignedTo?: CustomerAssignee | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  type: CustomerType;
  contactPerson?: string;
  email?: string;
  phone?: string;
  taxCode?: string;
  website?: string;
  industry?: string;
  source?: CustomerSource;
  status?: CustomerStatus;
  address?: string;
  city?: string;
  notes?: string;
  assignedToId?: string;
}

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

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
