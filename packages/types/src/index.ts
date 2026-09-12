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

/* ==================== M3 — Cơ hội bán hàng (Deals) ==================== */

/** Giai đoạn (stage) trong quy trình bán hàng */
export type DealStage =
  | 'prospecting'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

/** Trạng thái cơ hội (suy ra từ stage) */
export type DealStatus = 'open' | 'won' | 'lost';

/** Nguồn cơ hội (tái sử dụng nguồn khách hàng) */
export type DealSource = CustomerSource;

/** Loại hoạt động trong lịch sử cơ hội */
export type DealActivityType =
  | 'created'
  | 'note'
  | 'stage_change'
  | 'call'
  | 'email'
  | 'meeting'
  | 'task';

/** Tóm tắt khách hàng gắn với cơ hội */
export interface DealCustomerRef {
  id: string;
  code: string;
  name: string;
  type: CustomerType;
}

/** Người phụ trách cơ hội (nhân viên) */
export interface DealAssignee {
  id: string;
  code: string;
  fullName: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
}

export interface DealActivity {
  id: string;
  dealId: string;
  type: DealActivityType;
  content?: string | null;
  fromStage?: DealStage | null;
  toStage?: DealStage | null;
  createdById?: string | null;
  createdByName?: string | null;
  createdAt: string;
}

export interface Deal {
  id: string;
  code: string;
  name: string;
  customerId: string;
  customer?: DealCustomerRef | null;
  value: number;
  currency: string;
  probability: number;
  stage: DealStage;
  status: DealStatus;
  source?: DealSource | null;
  expectedCloseDate?: string | null;
  closedAt?: string | null;
  lostReason?: string | null;
  description?: string | null;
  assignedToId?: string | null;
  assignedTo?: DealAssignee | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  activities?: DealActivity[];
}

export interface CreateDealRequest {
  name: string;
  customerId: string;
  value?: number;
  probability?: number;
  stage?: DealStage;
  source?: DealSource;
  expectedCloseDate?: string;
  description?: string;
  assignedToId?: string;
}

export type UpdateDealRequest = Partial<CreateDealRequest> & {
  lostReason?: string;
};

export interface MoveDealStageRequest {
  stage: DealStage;
  lostReason?: string;
}

export interface CreateDealActivityRequest {
  type: DealActivityType;
  content: string;
}

/** Thống kê tổng hợp cơ hội bán hàng (dashboard) */
export interface DealStageStat {
  stage: DealStage;
  count: number;
  value: number;
}

export interface DealStats {
  totalOpen: number;
  totalOpenValue: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  conversionRate: number; // % won / (won + lost)
  weightedForecast: number; // tổng (value * probability) của cơ hội đang mở
  byStage: DealStageStat[];
}

/** Cột Kanban: các cơ hội theo từng stage */
export interface DealPipelineColumn {
  stage: DealStage;
  count: number;
  value: number;
  deals: Deal[];
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
