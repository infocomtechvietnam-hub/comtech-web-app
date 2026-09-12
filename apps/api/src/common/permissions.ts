/**
 * Định nghĩa danh sách quyền và ma trận phân quyền theo MO (Phần 5).
 * scope: 'all' | 'own' | 'department'
 */

export interface PermissionDef {
  resource: string;
  action: string;
  scope: string;
  description: string;
}

// Danh sách đầy đủ các quyền của hệ thống (M1 tập trung vào users/employees/departments)
export const PERMISSIONS: PermissionDef[] = [
  // Khách hàng
  { resource: 'customers', action: 'read', scope: 'all', description: 'Xem tất cả khách hàng' },
  { resource: 'customers', action: 'read', scope: 'department', description: 'Xem khách hàng trong phòng ban' },
  { resource: 'customers', action: 'read', scope: 'own', description: 'Xem khách hàng được phân công' },
  { resource: 'customers', action: 'create', scope: 'all', description: 'Tạo khách hàng' },
  { resource: 'customers', action: 'update', scope: 'all', description: 'Sửa mọi khách hàng' },
  { resource: 'customers', action: 'update', scope: 'department', description: 'Sửa khách hàng phòng ban' },
  { resource: 'customers', action: 'update', scope: 'own', description: 'Sửa khách hàng được phân công' },
  { resource: 'customers', action: 'delete', scope: 'all', description: 'Xóa/lưu trữ mọi khách hàng' },
  { resource: 'customers', action: 'delete', scope: 'department', description: 'Xóa/lưu trữ khách hàng phòng ban' },
  { resource: 'customers', action: 'assign', scope: 'all', description: 'Phân công khách hàng' },
  { resource: 'customers', action: 'assign', scope: 'department', description: 'Phân công khách hàng phòng ban' },
  { resource: 'customers', action: 'import', scope: 'all', description: 'Import khách hàng' },
  { resource: 'customers', action: 'export', scope: 'all', description: 'Export mọi khách hàng' },
  { resource: 'customers', action: 'export', scope: 'department', description: 'Export khách hàng phòng ban' },
  { resource: 'customers', action: 'export', scope: 'own', description: 'Export khách hàng được phân công' },

  // Cơ hội bán hàng
  { resource: 'opportunities', action: 'read', scope: 'all', description: 'Xem tất cả cơ hội' },
  { resource: 'opportunities', action: 'read', scope: 'department', description: 'Xem cơ hội phòng ban' },
  { resource: 'opportunities', action: 'read', scope: 'own', description: 'Xem cơ hội của mình' },
  { resource: 'opportunities', action: 'create', scope: 'all', description: 'Tạo cơ hội' },
  { resource: 'opportunities', action: 'update', scope: 'all', description: 'Sửa mọi cơ hội' },
  { resource: 'opportunities', action: 'update', scope: 'department', description: 'Sửa cơ hội phòng ban' },
  { resource: 'opportunities', action: 'update', scope: 'own', description: 'Sửa cơ hội của mình' },
  { resource: 'opportunities', action: 'delete', scope: 'all', description: 'Xóa cơ hội' },

  // Công việc & hoạt động
  { resource: 'activities', action: 'read', scope: 'all', description: 'Xem tất cả công việc' },
  { resource: 'activities', action: 'read', scope: 'department', description: 'Xem công việc phòng ban' },
  { resource: 'activities', action: 'read', scope: 'own', description: 'Xem công việc của mình' },
  { resource: 'activities', action: 'create', scope: 'all', description: 'Tạo công việc' },
  { resource: 'activities', action: 'assign', scope: 'department', description: 'Giao công việc trong phòng' },
  { resource: 'activities', action: 'update', scope: 'all', description: 'Sửa mọi công việc' },
  { resource: 'activities', action: 'update', scope: 'own', description: 'Sửa công việc của mình' },
  { resource: 'activities', action: 'delete', scope: 'all', description: 'Xóa công việc' },
  { resource: 'activities', action: 'delete', scope: 'own', description: 'Xóa công việc do mình tạo' },

  // Thư viện công việc
  { resource: 'task_library', action: 'read', scope: 'all', description: 'Xem thư viện công việc' },
  { resource: 'task_library', action: 'create', scope: 'all', description: 'Tạo mục thư viện' },
  { resource: 'task_library', action: 'update', scope: 'all', description: 'Sửa mục thư viện' },
  { resource: 'task_library', action: 'delete', scope: 'all', description: 'Xóa mục thư viện' },
  { resource: 'task_library', action: 'assign', scope: 'all', description: 'Gán KPI cho nhân viên' },

  // Nhân viên
  { resource: 'employees', action: 'read', scope: 'all', description: 'Xem tất cả nhân viên' },
  { resource: 'employees', action: 'read', scope: 'department', description: 'Xem nhân viên phòng ban' },
  { resource: 'employees', action: 'read', scope: 'own', description: 'Xem hồ sơ của mình' },
  { resource: 'employees', action: 'create', scope: 'all', description: 'Tạo hồ sơ nhân viên' },
  { resource: 'employees', action: 'update', scope: 'all', description: 'Sửa mọi hồ sơ' },
  { resource: 'employees', action: 'update', scope: 'own', description: 'Sửa hồ sơ của mình' },
  { resource: 'employees', action: 'delete', scope: 'all', description: 'Xóa/lưu trữ nhân viên' },
  { resource: 'employees', action: 'assign_role', scope: 'all', description: 'Gán vai trò cho nhân viên' },

  // Phòng ban
  { resource: 'departments', action: 'read', scope: 'all', description: 'Xem phòng ban' },
  { resource: 'departments', action: 'create', scope: 'all', description: 'Tạo phòng ban' },
  { resource: 'departments', action: 'update', scope: 'all', description: 'Sửa phòng ban' },
  { resource: 'departments', action: 'delete', scope: 'all', description: 'Xóa phòng ban' },
  { resource: 'departments', action: 'assign', scope: 'all', description: 'Gán nhân viên/quản lý phòng ban' },

  // Chấm công
  { resource: 'attendance', action: 'check', scope: 'own', description: 'Chấm công cá nhân' },
  { resource: 'attendance', action: 'read', scope: 'own', description: 'Xem lịch sử chấm công cá nhân' },
  { resource: 'attendance', action: 'read', scope: 'all', description: 'Xem toàn bộ chấm công' },
  { resource: 'attendance', action: 'read', scope: 'department', description: 'Xem chấm công phòng ban' },
  { resource: 'attendance', action: 'export', scope: 'all', description: 'Xuất báo cáo chấm công' },
  { resource: 'attendance', action: 'export', scope: 'department', description: 'Xuất báo cáo chấm công phòng ban' },
  { resource: 'attendance', action: 'update', scope: 'all', description: 'Sửa bản ghi chấm công' },

  // Thông báo
  { resource: 'notifications', action: 'read', scope: 'own', description: 'Nhận thông báo' },
  { resource: 'notifications', action: 'create', scope: 'department', description: 'Gửi thông báo trong phòng' },
  { resource: 'notifications', action: 'approve', scope: 'all', description: 'Duyệt thông báo ra ngoài' },

  // Nhật ký & báo cáo
  { resource: 'audit_logs', action: 'read', scope: 'all', description: 'Xem toàn bộ nhật ký' },
  { resource: 'audit_logs', action: 'read', scope: 'department', description: 'Xem nhật ký phòng ban' },
  { resource: 'audit_logs', action: 'export', scope: 'all', description: 'Xuất nhật ký' },
  { resource: 'reports', action: 'read', scope: 'all', description: 'Xem mọi báo cáo' },
  { resource: 'reports', action: 'read', scope: 'department', description: 'Xem báo cáo phòng ban' },
  { resource: 'reports', action: 'read', scope: 'own', description: 'Xem báo cáo của mình' },

  // Cài đặt / quản trị tài khoản
  { resource: 'users', action: 'read', scope: 'all', description: 'Xem danh sách tài khoản' },
  { resource: 'users', action: 'create', scope: 'all', description: 'Tạo tài khoản' },
  { resource: 'users', action: 'update', scope: 'all', description: 'Sửa/khóa/mở khóa tài khoản' },
  { resource: 'users', action: 'delete', scope: 'all', description: 'Xóa tài khoản' },
  { resource: 'roles', action: 'read', scope: 'all', description: 'Xem vai trò & quyền' },
  { resource: 'roles', action: 'update', scope: 'all', description: 'Cấu hình vai trò & quyền' },
  { resource: 'settings', action: 'update', scope: 'all', description: 'Cấu hình hệ thống' },
];

const key = (p: { resource: string; action: string; scope: string }) =>
  `${p.resource}:${p.action}:${p.scope}`;

const all = (...resources: { resource: string; action: string; scope: string }[]) =>
  resources.map(key);

// Ma trận vai trò → danh sách quyền (theo MO Phần 5)
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  // Admin: toàn quyền
  admin: PERMISSIONS.map(key),

  // Manager
  manager: [
    'customers:read:department', 'customers:create:all', 'customers:update:department',
    'customers:delete:department', 'customers:assign:department', 'customers:import:all',
    'customers:export:department',
    'opportunities:read:department', 'opportunities:create:all', 'opportunities:update:department',
    'activities:read:department', 'activities:create:all', 'activities:assign:department',
    'activities:update:all',
    'task_library:read:all', 'task_library:create:all', 'task_library:update:all', 'task_library:assign:all',
    'employees:read:department', 'employees:read:own',
    'departments:read:all',
    'attendance:check:own', 'attendance:read:own', 'attendance:read:department', 'attendance:export:department',
    'notifications:read:own', 'notifications:create:department', 'notifications:approve:all',
    'audit_logs:read:department',
    'reports:read:department',
  ],

  // Employee / Sales
  employee: [
    'customers:read:own', 'customers:create:all', 'customers:update:own', 'customers:export:own',
    'opportunities:read:own', 'opportunities:create:all', 'opportunities:update:own',
    'activities:read:own', 'activities:create:all', 'activities:update:own',
    'task_library:read:all',
    'employees:read:own', 'employees:update:own',
    'departments:read:all',
    'attendance:check:own', 'attendance:read:own',
    'notifications:read:own',
    'reports:read:own',
  ],

  // HR
  hr: [
    'employees:read:all', 'employees:create:all', 'employees:update:all',
    'departments:read:all', 'departments:assign:all',
    'attendance:check:own', 'attendance:read:own', 'attendance:read:all', 'attendance:export:all', 'attendance:update:all',
    'notifications:read:own', 'notifications:create:department',
    'reports:read:all',
  ],

  // HR Manager
  hr_manager: [
    'employees:read:all', 'employees:create:all', 'employees:update:all',
    'departments:read:all', 'departments:create:all', 'departments:update:all',
    'departments:delete:all', 'departments:assign:all',
    'attendance:check:own', 'attendance:read:own', 'attendance:read:all', 'attendance:export:all', 'attendance:update:all',
    'notifications:read:own', 'notifications:create:department', 'notifications:approve:all',
    'reports:read:all',
  ],
};

export const ROLE_DISPLAY: Record<string, { displayName: string; description: string }> = {
  admin: { displayName: 'Quản trị viên', description: 'Toàn quyền quản trị hệ thống' },
  manager: { displayName: 'Quản lý', description: 'Trưởng phòng, giám sát nhóm' },
  employee: { displayName: 'Nhân viên', description: 'Nhân viên kinh doanh / chuyên viên' },
  hr: { displayName: 'Nhân sự', description: 'Quản lý hồ sơ nhân viên' },
  hr_manager: { displayName: 'Quản lý Nhân sự', description: 'Trưởng phòng nhân sự' },
};
