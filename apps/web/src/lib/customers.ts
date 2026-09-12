import type {
  CustomerSource,
  CustomerStatus,
  CustomerType,
} from '@comtech/types';

/** Nhãn tiếng Việt cho trạng thái khách hàng */
export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  lead: 'Tiềm năng',
  prospect: 'Đang tiếp cận',
  active: 'Đang hợp tác',
  inactive: 'Ngừng hợp tác',
};

/** Class màu badge cho từng trạng thái */
export const CUSTOMER_STATUS_BADGE: Record<CustomerStatus, string> = {
  lead: 'bg-slate-100 text-slate-700',
  prospect: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
};

/** Nhãn tiếng Việt cho loại khách hàng */
export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  company: 'Doanh nghiệp',
  individual: 'Cá nhân',
};

/** Nhãn tiếng Việt cho nguồn khách hàng */
export const CUSTOMER_SOURCE_LABELS: Record<CustomerSource, string> = {
  website: 'Website',
  referral: 'Giới thiệu',
  event: 'Sự kiện',
  cold_call: 'Gọi điện',
  social: 'Mạng xã hội',
  other: 'Khác',
};

export const CUSTOMER_STATUS_OPTIONS: CustomerStatus[] = [
  'lead',
  'prospect',
  'active',
  'inactive',
];

export const CUSTOMER_TYPE_OPTIONS: CustomerType[] = ['company', 'individual'];

export const CUSTOMER_SOURCE_OPTIONS: CustomerSource[] = [
  'website',
  'referral',
  'event',
  'cold_call',
  'social',
  'other',
];
