'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Lock, Unlock, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type {
  Paginated,
  UserSummary,
  Department,
  RoleName,
} from '@comtech/types';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS, ROLE_BADGE_CLASS } from '@/lib/nav';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE = 20;

const ROLE_OPTIONS: RoleName[] = ['admin', 'manager', 'employee', 'hr', 'hr_manager'];

export default function UsersPage() {
  const { hasRole } = useAuth();
  const [data, setData] = useState<Paginated<UserSummary> | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const isAdmin = hasRole('admin');

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get<Paginated<UserSummary>>(
        `/users?page=${p}&pageSize=${PAGE_SIZE}`,
      );
      setData(res);
    } catch (err: any) {
      toast.error(err?.message ?? 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers(page);
  }, [page, isAdmin, fetchUsers]);

  useEffect(() => {
    if (!isAdmin) return;
    api
      .get<Department[]>('/departments')
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, [isAdmin]);

  async function toggleLock(u: UserSummary) {
    setActionId(u.id);
    try {
      const action = u.isLocked ? 'unlock' : 'lock';
      await api.patch(`/users/${u.id}/${action}`);
      toast.success(u.isLocked ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
      fetchUsers(page);
    } catch (err: any) {
      toast.error(err?.message ?? 'Thao tác thất bại.');
    } finally {
      setActionId(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Không có quyền truy cập</h2>
        <p className="text-muted-foreground">
          Bạn không có quyền truy cập chức năng này.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý người dùng</h2>
          <p className="text-muted-foreground">
            Tạo, khóa và quản lý tài khoản người dùng.
          </p>
        </div>
        <CreateUserDialog
          departments={departments}
          onCreated={() => fetchUsers(page)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã NV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : !data || data.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Chưa có người dùng nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.data.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs">
                        {u.employee?.code ?? '—'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {u.employee?.fullName ?? '—'}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <span
                              key={r.id}
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                ROLE_BADGE_CLASS[r.name] ?? 'bg-gray-100 text-gray-700',
                              )}
                            >
                              {ROLE_LABELS[r.name] ?? r.displayName}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.isLocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Bị khóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Hoạt động
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={u.isLocked ? 'outline' : 'ghost'}
                          size="sm"
                          disabled={actionId === u.id}
                          onClick={() => toggleLock(u)}
                        >
                          {actionId === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : u.isLocked ? (
                            <>
                              <Unlock className="mr-1 h-4 w-4" /> Mở khóa
                            </>
                          ) : (
                            <>
                              <Lock className="mr-1 h-4 w-4" /> Khóa
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Tổng cộng {data.total} người dùng — Trang {data.page}/{data.totalPages}
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
    </div>
  );
}

function CreateUserDialog({
  departments,
  onCreated,
}: {
  departments: Department[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    roleName: '' as RoleName | '',
    departmentId: '',
    jobTitle: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên.';
    if (!form.email.trim()) e.email = 'Vui lòng nhập email.';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      e.email = 'Email không hợp lệ.';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu.';
    else if (form.password.length < 8)
      e.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
    if (!form.roleName) e.roleName = 'Vui lòng chọn vai trò.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post('/users', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        roleName: form.roleName,
        departmentId: form.departmentId || undefined,
        jobTitle: form.jobTitle.trim() || undefined,
      });
      toast.success('Tạo tài khoản thành công!');
      setOpen(false);
      setForm({
        fullName: '',
        email: '',
        password: '',
        roleName: '',
        departmentId: '',
        jobTitle: '',
      });
      setErrors({});
      onCreated();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Không thể tạo tài khoản.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Tạo tài khoản mới
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo tài khoản mới</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Họ và tên *</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600">{errors.fullName}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu *</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Vai trò *</Label>
              <Select
                value={form.roleName}
                onValueChange={(v) => setForm({ ...form, roleName: v as RoleName })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.roleName && (
                <p className="text-xs text-red-600">{errors.roleName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Phòng ban</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => setForm({ ...form, departmentId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng ban" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Chức danh</Label>
            <Input
              id="jobTitle"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tạo tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
