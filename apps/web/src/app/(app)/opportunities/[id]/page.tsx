'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  ShieldAlert,
  Building2,
  User2,
  CalendarClock,
  Percent,
  Coins,
  Tag,
  StickyNote,
  Phone,
  Mail,
  Users,
  CheckSquare,
  Plus,
  History,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  Deal,
  DealActivity,
  DealActivityType,
  DealStage,
} from '@comtech/types';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn, formatDate } from '@/lib/utils';
import {
  DEAL_ACTIVITY_INPUT_OPTIONS,
  DEAL_ACTIVITY_LABELS,
  DEAL_SOURCE_LABELS,
  DEAL_STAGE_BADGE,
  DEAL_STAGE_LABELS,
  DEAL_STAGE_OPTIONS,
  DEAL_STATUS_BADGE,
  DEAL_STATUS_LABELS,
  formatCurrency,
} from '@/lib/deals';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ACTIVITY_ICONS: Record<DealActivityType, any> = {
  created: Sparkles,
  note: StickyNote,
  stage_change: ArrowRightLeft,
  call: Phone,
  email: Mail,
  meeting: Users,
  task: CheckSquare,
};

export default function OpportunityDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { hasRole } = useAuth();
  const canRead = hasRole('admin', 'manager', 'employee');
  const canEdit = hasRole('admin', 'manager', 'employee');
  const canDelete = hasRole('admin');

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [noteType, setNoteType] = useState<DealActivityType>('note');
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const [movingStage, setMovingStage] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lostOpen, setLostOpen] = useState(false);
  const [lostReason, setLostReason] = useState('');

  const fetchDeal = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const d = await api.get<Deal>(`/deals/${id}`);
      setDeal(d);
    } catch (err: any) {
      setNotFound(true);
      toast.error(err?.message ?? 'Không tìm thấy cơ hội.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!canRead) return;
    fetchDeal();
  }, [canRead, fetchDeal]);

  async function doMoveStage(stage: DealStage, reason?: string) {
    if (!deal) return;
    setMovingStage(true);
    try {
      const updated = await api.patch<Deal>(`/deals/${deal.id}/stage`, {
        stage,
        lostReason: reason,
      });
      setDeal(updated);
      setLostOpen(false);
      setLostReason('');
      toast.success(`Đã chuyển sang "${DEAL_STAGE_LABELS[stage]}".`);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Không thể chuyển giai đoạn.';
      toast.error(msg);
    } finally {
      setMovingStage(false);
    }
  }

  function handleStageSelect(stage: DealStage) {
    if (!deal || stage === deal.stage) return;
    if (stage === 'closed_lost') {
      setLostReason('');
      setLostOpen(true);
      return;
    }
    doMoveStage(stage);
  }

  async function handleAddNote(ev: React.FormEvent) {
    ev.preventDefault();
    if (!deal || !noteContent.trim()) {
      toast.error('Vui lòng nhập nội dung.');
      return;
    }
    setAddingNote(true);
    try {
      const updated = await api.post<Deal>(`/deals/${deal.id}/activities`, {
        type: noteType,
        content: noteContent.trim(),
      });
      setDeal(updated);
      setNoteContent('');
      toast.success('Đã thêm hoạt động.');
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Không thể thêm hoạt động.';
      toast.error(msg);
    } finally {
      setAddingNote(false);
    }
  }

  async function handleDelete() {
    if (!deal) return;
    setDeleting(true);
    try {
      await api.delete(`/deals/${deal.id}`);
      toast.success('Đã xóa cơ hội.');
      router.push('/opportunities');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể xóa cơ hội.';
      toast.error(msg);
      setDeleting(false);
    }
  }

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Không có quyền truy cập</h2>
        <p className="text-muted-foreground">
          Bạn không có quyền xem chi tiết cơ hội.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !deal) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <h2 className="text-xl font-semibold">Không tìm thấy cơ hội</h2>
        <Button asChild variant="outline">
          <Link href="/opportunities">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const activities = deal.activities ?? [];

  const infoRows = [
    {
      icon: Building2,
      label: 'Khách hàng',
      value: deal.customer ? (
        <Link
          href={`/customers/${deal.customerId}`}
          className="text-primary hover:underline"
        >
          {deal.customer.name} ({deal.customer.code})
        </Link>
      ) : (
        '—'
      ),
    },
    { icon: Coins, label: 'Giá trị', value: formatCurrency(deal.value) },
    { icon: Percent, label: 'Xác suất thắng', value: `${deal.probability}%` },
    {
      icon: CalendarClock,
      label: 'Ngày dự kiến chốt',
      value: formatDate(deal.expectedCloseDate),
    },
    {
      icon: User2,
      label: 'Người phụ trách',
      value: deal.assignedTo?.fullName ?? '—',
    },
    {
      icon: Tag,
      label: 'Nguồn',
      value: deal.source ? DEAL_SOURCE_LABELS[deal.source] : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/opportunities">
            <ArrowLeft className="mr-1 h-4 w-4" /> Danh sách
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold">{deal.name}</h2>
            <span className="font-mono text-sm text-muted-foreground">
              {deal.code}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                DEAL_STAGE_BADGE[deal.stage],
              )}
            >
              {DEAL_STAGE_LABELS[deal.stage]}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                DEAL_STATUS_BADGE[deal.status],
              )}
            >
              {DEAL_STATUS_LABELS[deal.status]}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/opportunities/${deal.id}/edit`}>
                <Pencil className="mr-1 h-4 w-4" /> Sửa
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Xóa
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin cơ hội</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {infoRows.map((r) => {
                const Icon = r.icon;
                return (
                  <div key={r.label} className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{r.label}</p>
                      <p className="text-sm font-medium">{r.value}</p>
                    </div>
                  </div>
                );
              })}
              {deal.lostReason && (
                <div className="flex items-start gap-3 sm:col-span-2">
                  <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Lý do thất bại
                    </p>
                    <p className="text-sm font-medium">{deal.lostReason}</p>
                  </div>
                </div>
              )}
              {deal.description && (
                <div className="flex items-start gap-3 sm:col-span-2">
                  <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mô tả</p>
                    <p className="whitespace-pre-line text-sm">
                      {deal.description}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" /> Lịch sử hoạt động
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canEdit && (
                <form
                  onSubmit={handleAddNote}
                  className="space-y-3 rounded-lg border bg-muted/30 p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Select
                      value={noteType}
                      onValueChange={(v) => setNoteType(v as DealActivityType)}
                    >
                      <SelectTrigger className="w-full sm:w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DEAL_ACTIVITY_INPUT_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {DEAL_ACTIVITY_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={noteContent}
                      placeholder="Nhập nội dung hoạt động / ghi chú..."
                      className="flex-1"
                      onChange={(e) => setNoteContent(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={addingNote}>
                      {addingNote ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-1 h-4 w-4" />
                      )}
                      Thêm hoạt động
                    </Button>
                  </div>
                </form>
              )}

              {activities.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Chưa có hoạt động nào.
                </p>
              ) : (
                <ol className="relative space-y-4 border-l pl-6">
                  {activities.map((a: DealActivity) => {
                    const Icon = ACTIVITY_ICONS[a.type] ?? StickyNote;
                    return (
                      <li key={a.id} className="relative">
                        <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border bg-background">
                          <Icon className="h-3 w-3 text-primary" />
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            {DEAL_ACTIVITY_LABELS[a.type]}
                          </span>
                          {a.type === 'stage_change' &&
                            a.fromStage &&
                            a.toStage && (
                              <span className="text-xs text-muted-foreground">
                                {DEAL_STAGE_LABELS[a.fromStage]} →{' '}
                                {DEAL_STAGE_LABELS[a.toStage]}
                              </span>
                            )}
                        </div>
                        {a.content && (
                          <p className="text-sm text-muted-foreground">
                            {a.content}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground/70">
                          {a.createdByName ? `${a.createdByName} · ` : ''}
                          {formatDate(a.createdAt)}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chuyển giai đoạn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label>Giai đoạn hiện tại</Label>
              <Select
                value={deal.stage}
                onValueChange={(v) => handleStageSelect(v as DealStage)}
                disabled={!canEdit || movingStage}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {DEAL_STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {movingStage && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Đang cập nhật...
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Thay đổi giai đoạn sẽ được ghi lại trong lịch sử hoạt động.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin khác</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày tạo</span>
                <span>{formatDate(deal.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cập nhật</span>
                <span>{formatDate(deal.updatedAt)}</span>
              </div>
              {deal.closedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày chốt</span>
                  <span>{formatDate(deal.closedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={lostOpen} onOpenChange={(o) => !o && setLostOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Đánh dấu cơ hội thất bại</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Vui lòng cho biết lý do thất bại (không bắt buộc).
          </p>
          <div className="space-y-2">
            <Label htmlFor="lostReason">Lý do thất bại</Label>
            <Textarea
              id="lostReason"
              value={lostReason}
              placeholder="VD: Khách chọn nhà cung cấp khác..."
              onChange={(e) => setLostReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLostOpen(false)}
              disabled={movingStage}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={movingStage}
              onClick={() =>
                doMoveStage('closed_lost', lostReason.trim() || undefined)
              }
            >
              {movingStage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa cơ hội</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa cơ hội{' '}
            <span className="font-semibold text-foreground">{deal.name}</span> (
            {deal.code})? Hành động này sẽ ẩn cơ hội khỏi danh sách.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
