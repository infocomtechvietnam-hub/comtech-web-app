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
  Users2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Customer, CustomerStatus, CustomerType, Paginated } from '@comtech/types';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn, formatDate } from '@/lib/utils';
import {
  CUSTOMER_STATUS_BADGE,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_OPTIONS,
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_TYPE_OPTIONS,
} from '@/lib/customers';
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

export default function CustomersPage() {
  const { hasRole } = useAuth();
  const canRead = hasRole('admin', 'manager', 'employee');
  const canCreate = hasRole('admin', 'manager', 'employee');
  const canDelete = hasRole('admin', 'manager');

  const [data, setData] = useState<Paginated<Customer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatus | typeof ALL>(ALL);
  const [type, setType] = useState<CustomerType | typeof ALL>(ALL);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    if (status !== ALL) params.set('status', status);
    if (type !== ALL) params.set('type', type);
    return params.toString();
  }, [page, debouncedSearch, status, type]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<Customer>>(`/customers?${queryString}`);
      setData(res);
    } catch (err: any) {
      toast.error(err?.message ?? 'Không thể tải danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    if (!canRead) return;
    fetchData();
  }, [canRead, fetchData]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/customers/${deleteTarget.id}`);
      toast.success('Đã xóa khách hàng.');
      setDeleteTarget(null);
      if (data && data.data.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchData();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể xóa khách hàng.';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  function resetFilters() {
    setSearch('');
    setStatus(ALL);
    setType(ALL);
    setPage(1);
  }

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Không có quyền truy cập</h2>
        <p className="text-muted-foreground">
          Bạn không có quyền xem danh sách khách hàng.
        </p>
      </div>
    );
  }

  const hasFilter = search.trim() !== '' || status !== ALL || type !== ALL;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Khách hàng</h2>
          <p className="text-muted-foreground">
            Quản lý danh sách khách hàng và thông tin liên hệ.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="mr-1 h-4 w-4" /> Thêm khách hàng
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, mã, email, số điện thoại..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as CustomerStatus | typeof ALL);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
                {CUSTOMER_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {CUSTOMER_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as CustomerType | typeof ALL);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả loại</SelectItem>
                {CUSTOMER_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {CUSTOMER_TYPE_LABELS[t]}
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
                  <TableHead>Mã KH</TableHead>
                  <TableHead>Tên khách hàng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Phụ trách</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : !data || data.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-14 text-center">
                      <Users2 className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-muted-foreground">
                        {hasFilter
                          ? 'Không tìm thấy khách hàng phù hợp.'
                          : 'Chưa có khách hàng nào. Hãy thêm khách hàng đầu tiên.'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.data.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.code}</TableCell>
                      <TableCell>
                        <Link
                          href={`/customers/${c.id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline"
                        >
                          {c.name}
                        </Link>
                        {c.contactPerson && (
                          <p className="text-xs text-muted-foreground">
                            {c.contactPerson}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {CUSTOMER_TYPE_LABELS[c.type]}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.phone && <div>{c.phone}</div>}
                        {c.email && (
                          <div className="text-xs text-muted-foreground">
                            {c.email}
                          </div>
                        )}
                        {!c.phone && !c.email && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.assignedTo?.fullName ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            CUSTOMER_STATUS_BADGE[c.status],
                          )}
                        >
                          {CUSTOMER_STATUS_LABELS[c.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="sm" title="Xem">
                            <Link href={`/customers/${c.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="sm" title="Sửa">
                            <Link href={`/customers/${c.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Xóa"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setDeleteTarget(c)}
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
            Tổng cộng {data.total} khách hàng — Trang {data.page}/{data.totalPages}
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

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa khách hàng</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa khách hàng{' '}
            <span className="font-semibold text-foreground">
              {deleteTarget?.name}
            </span>{' '}
            ({deleteTarget?.code})? Hành động này sẽ ẩn khách hàng khỏi danh sách.
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
