import type {
  DealActivityType,
  DealSource,
  DealStage,
  DealStatus,
} from '@comtech/types';

/** Nhãn tiếng Việt cho từng giai đoạn (stage) */
export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  prospecting: 'Tiềm năng',
  qualification: 'Đánh giá',
  proposal: 'Báo giá',
  negotiation: 'Đàm phán',
  closed_won: 'Thắng',
  closed_lost: 'Thất bại',
};

/** Class màu badge cho từng giai đoạn */
export const DEAL_STAGE_BADGE: Record<DealStage, string> = {
  prospecting: 'bg-slate-100 text-slate-700',
  qualification: 'bg-blue-100 text-blue-700',
  proposal: 'bg-amber-100 text-amber-700',
  negotiation: 'bg-purple-100 text-purple-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-red-100 text-red-700',
};

/** Màu nền/viền cho cột Kanban theo giai đoạn */
export const DEAL_STAGE_ACCENT: Record<DealStage, string> = {
  prospecting: 'border-t-slate-400',
  qualification: 'border-t-blue-500',
  proposal: 'border-t-amber-500',
  negotiation: 'border-t-purple-500',
  closed_won: 'border-t-green-500',
  closed_lost: 'border-t-red-500',
};

/** Màu thanh (bar) cho biểu đồ phễu theo giai đoạn */
export const DEAL_STAGE_BAR: Record<DealStage, string> = {
  prospecting: 'bg-slate-400',
  qualification: 'bg-blue-500',
  proposal: 'bg-amber-500',
  negotiation: 'bg-purple-500',
  closed_won: 'bg-green-500',
  closed_lost: 'bg-red-500',
};

/** Xác suất mặc định (%) tương ứng từng giai đoạn */
export const STAGE_PROBABILITY: Record<DealStage, number> = {
  prospecting: 10,
  qualification: 30,
  proposal: 50,
  negotiation: 70,
  closed_won: 100,
  closed_lost: 0,
};

/** Toàn bộ giai đoạn theo thứ tự phễu bán hàng */
export const DEAL_STAGE_OPTIONS: DealStage[] = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
];

/** Các giai đoạn hiển thị trên bảng Kanban (theo thứ tự) */
export const KANBAN_STAGES: DealStage[] = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
];

/** Nhãn tiếng Việt cho trạng thái cơ hội */
export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  open: 'Đang mở',
  won: 'Đã thắng',
  lost: 'Đã mất',
};

export const DEAL_STATUS_BADGE: Record<DealStatus, string> = {
  open: 'bg-blue-100 text-blue-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

export const DEAL_STATUS_OPTIONS: DealStatus[] = ['open', 'won', 'lost'];

/** Nhãn tiếng Việt cho nguồn cơ hội (tái sử dụng nguồn khách hàng) */
export const DEAL_SOURCE_LABELS: Record<DealSource, string> = {
  website: 'Website',
  referral: 'Giới thiệu',
  event: 'Sự kiện',
  cold_call: 'Gọi điện',
  social: 'Mạng xã hội',
  other: 'Khác',
};

export const DEAL_SOURCE_OPTIONS: DealSource[] = [
  'website',
  'referral',
  'event',
  'cold_call',
  'social',
  'other',
];

/** Nhãn tiếng Việt cho loại hoạt động */
export const DEAL_ACTIVITY_LABELS: Record<DealActivityType, string> = {
  created: 'Khởi tạo',
  note: 'Ghi chú',
  stage_change: 'Chuyển giai đoạn',
  call: 'Gọi điện',
  email: 'Email',
  meeting: 'Cuộc họp',
  task: 'Công việc',
};

/** Các loại hoạt động người dùng có thể thêm thủ công */
export const DEAL_ACTIVITY_INPUT_OPTIONS: DealActivityType[] = [
  'note',
  'call',
  'email',
  'meeting',
  'task',
];

/** Định dạng tiền tệ VND */
export function formatCurrency(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

/** Định dạng gọn cho số tiền lớn (vd: 1,2 tỷ) */
export function formatCurrencyShort(value?: number | null): string {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return '0 ₫';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000)
    return `${(n / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ ₫`;
  if (abs >= 1_000_000)
    return `${(n / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr ₫`;
  return formatCurrency(n);
}
