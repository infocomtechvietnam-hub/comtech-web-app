'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Briefcase,
  LayoutGrid,
  List as ListIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Deal, DealStage, DealStatus, DealAssignee, Paginated } from '@comtech/types';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn, formatDate } from '@/lib/utils';
import {
  DEAL_STAGE_BADGE,
  DEAL_STAGE_LABELS,
  DEAL_STAGE_OPTIONS,
  DEAL_STATUS_BADGE,
  DEAL_STATUS_LABELS,
  DEAL_STATUS_OPTIONS,
  formatCurrency,
} from '@/lib/deals';
import { DealStatsPanel } from '@/components/deal-stats';
import { DealKanban } from '@/components/deal-kanban';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

const PAGE_SIZE = 20;
const ALL = '__all__';
type ViewMode = 'table' | 'kanban';

export default function OpportunitiesPage() {
  const { hasRole } = useAuth();
  const canRead = hasRole('admin', 'manager', 'employee');
  const canCreate = hasRole('admin', 'manager', 'employee');
  const canDelete = hasRole('admin');
  const canMove = hasRole('admin', 'manager', 'employee');

  const [view, setView] = useState<ViewMode>('table');
  const [statsKey, setStatsKey] = useState(0);

  const [data, setData] = useState<Paginated<Deal> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [stage, setStage] = useState<DealStage | typeof ALL>(ALL);
  const [status, setStatus] = useState<DealStatus | typeof ALL>(ALL);
  const [assignedToId, setAssignedToId] = useState<string>(ALL);
  const [assignees, setAssignees] = useState<DealAssignee[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get<DealAssignee[]>('/deals/assignees')
      .then(setAssignees)
      .catch(() => setAssignees([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (stage !== ALL) params.set('stage', stage);
    if (status !== ALL) params.set('status', status);
    if (assignedToId !== ALL) params.set('assignedToId', assignedToId);
    return params.toString();
  }, [page, debouncedSearch, stage, status, assignedToId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Deal>>(`/deals?${queryString}`);
      setData(res);
    } catch (err: any) {
      toast.error(err?.message ?? 'Không thể tải danh sách cơ hội.');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    if (!canRead || view !== 'table') return;
    fetchData();
  }, [canRead, view, fetchData]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/deals/${deleteTarget.id}`);
      toast.success('Đã xóa cơ hội bán hàng.');
      setDeleteTarget(null);
      setStatsKey((k) => k + 1);
      if (data && data.data.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchData();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể xóa cơ hội.';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  function resetFilters() {
    setSearch('');
    setStage(ALL);
    setStatus(ALL);
    setAssignedToId(ALL);
    setPage(1);
  }

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Không có quyền truy cập</h2>
        <p className="text-muted-foreground">
          Bạn không có quyền xem danh sách cơ hội bán hàng.
        </p>
      </div>
    );
  }

  const hasFilter =
    search.trim() !== '' ||
    stage !== ALL ||
    status !== ALL ||
    assignedToId !== ALL;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cơ hội bán hàng</h2>
          <p className="text-muted-foreground">
            Quản lý cơ hội, quy trình bán hàng và dự báo doanh thu.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/opportunities/new">
              <Plus className="mr-1 h-4 w-4" /> Thêm cơ hội
            </Link>
          </Button>
        )}
      </div>

      <DealStatsPanel refreshKey={statsKey} />

      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-lg border p-1">
          <Button
            variant={view === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('table')}
          >
            <ListIcon className="mr-1 h-4 w-4" /> Danh sách
          </Button>
          <Button
            variant={view === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('kanban')}
          >
            <LayoutGrid className="mr-1 h-4 w-4" /> Kanban
          </Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <DealKanban canMove={canMove} onChanged={() => setStatsKey((k) => k + 1)} />
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc mã cơ hội..."
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Select
                  value={stage}
                  onValueChange={(v) => {
                    setStage(v as DealStage | typeof ALL);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Giai đoạn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Tất cả giai đoạn</SelectItem>
                    {DEAL_STAGE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {DEAL_STAGE_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v as DealStatus | typeof ALL);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
                    {DEAL_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {DEAL_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={assignedToId}
                  onValueChange={(v) => {
                    setAssignedToId(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Người phụ trách" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Tất cả phụ trách</SelectItem>
                    {assignees.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasFilter && (
                  <Button variant="outline" onClick={resetFilters}>
                    Xóa lọc
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã CH</TableHead>
                      <TableHead>Tên cơ hội</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Giá trị</TableHead>
                      <TableHead>Giai đoạn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Phụ trách</TableHead>
                      <TableHead>Dự kiến chốt</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-10 text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : !data || data.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="py-14 text-center">
                          <Briefcase className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                          <p className="text-muted-foreground">
                            {hasFilter
                              ? 'Không tìm thấy cơ hội phù hợp.'
                              : 'Chưa có cơ hội nào. Hãy thêm cơ hội đầu tiên.'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.data.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-mono text-xs">
                            {d.code}
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/opportunities/${d.id}`}
                              className="font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {d.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm">
                            {d.customer?.name ?? (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-semibold">
                            {formatCurrency(d.value)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                DEAL_STAGE_BADGE[d.stage],
                              )}
                            >
                              {DEAL_STAGE_LABELS[d.stage]}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                DEAL_STATUS_BADGE[d.status],
                              )}
                            >
                              {DEAL_STATUS_LABELS[d.status]}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {d.assignedTo?.fullName ?? (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(d.expectedCloseDate)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button asChild variant="ghost" size="sm" title="Xem">
                                <Link href={`/opportunities/${d.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button asChild variant="ghost" size="sm" title="Sửa">
                                <Link href={`/opportunities/${d.id}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Xóa"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => setDeleteTarget(d)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {data && data.total > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Tổng cộng {data.total} cơ hội — Trang {data.page}/{data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" /> Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa cơ hội</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa cơ hội{' '}
            <span className="font-semibold text-foreground">
              {deleteTarget?.name}
            </span>{' '}
            ({deleteTarget?.code})? Hành động này sẽ ẩn cơ hội khỏi danh sách.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
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
