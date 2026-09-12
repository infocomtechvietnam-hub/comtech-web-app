import {
  LayoutDashboard,
  Users2,
  Target,
  ClipboardList,
  Library,
  UserCog,
  Building2,
  CalendarCheck,
  BarChart3,
  Bell,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { RoleName } from '@comtech/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Vai trò được phép nhìn thấy; bỏ trống = mọi vai trò */
  roles?: RoleName[];
}

// Menu điều hướng — nhãn tiếng Việt, có icon
export const NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Khách hàng', href: '/customers', icon: Users2, roles: ['admin', 'manager', 'employee'] },
  { label: 'Cơ hội', href: '/opportunities', icon: Target, roles: ['admin', 'manager', 'employee'] },
  { label: 'Công việc', href: '/activities', icon: ClipboardList, roles: ['admin', 'manager', 'employee'] },
  { label: 'Thư viện CV', href: '/task-library', icon: Library, roles: ['admin', 'manager', 'employee'] },
  { label: 'Nhân viên', href: '/employees', icon: UserCog, roles: ['admin', 'manager', 'hr', 'hr_manager'] },
  { label: 'Phòng ban', href: '/departments', icon: Building2 },
  { label: 'Chấm công', href: '/attendance', icon: CalendarCheck },
  { label: 'Báo cáo', href: '/reports', icon: BarChart3, roles: ['admin', 'manager', 'hr', 'hr_manager'] },
  { label: 'Thông báo', href: '/notifications', icon: Bell },
  { label: 'Cài đặt', href: '/settings/profile', icon: Settings },
];

export function visibleNavItems(roles: string[]): NavItem[] {
  return NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.some((r) => roles.includes(r)),
  );
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  manager: 'Quản lý',
  employee: 'Nhân viên',
  hr: 'Nhân sự',
  hr_manager: 'Quản lý Nhân sự',
};

export const ROLE_BADGE_CLASS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  employee: 'bg-green-100 text-green-700',
  hr: 'bg-purple-100 text-purple-700',
  hr_manager: 'bg-amber-100 text-amber-700',
};
