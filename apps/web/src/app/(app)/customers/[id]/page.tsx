'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Building2,
  User as UserIcon,
  Mail,
  Phone,
  Globe,
  MapPin,
  Hash,
  Briefcase,
  UserCheck,
  Calendar,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Customer } from '@comtech/types';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn, formatDate } from '@/lib/utils';
import {
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_STATUS_BADGE,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_TYPE_LABELS,
} from '@/lib/customers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium">
          {value ? value : <span className="text-muted-foreground">—</span>}
        </p>
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'manager', 'employee');
  const canDelete = hasRole('admin', 'manager');

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<Customer>(`/customers/${id}`)
      .then((c) => setCustomer(c))
      .catch((err) => {
        setNotFound(true);
        toast.error(err?.message ?? 'Không tìm thấy khách hàng.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!customer) return;
    setDeleting(true);
    try {
      await api.delete(`/customers/${customer.id}`);
      toast.success('Đã xóa khách hàng.');
      router.push('/customers');
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể xóa khách hàng.';
      toast.error(msg);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !customer) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <h2 className="text-xl font-semibold">Không tìm thấy khách hàng</h2>
        <Button asChild variant="outline">
          <Link href="/customers">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const TypeIcon = customer.type === 'company' ? Building2 : UserIcon;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/customers">
            <ArrowLeft className="mr-1 h-4 w-4" /> Danh sách
          </Link>
        </Button>
        <div className="flex gap-2">
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/customers/${customer.id}/edit`}>
                <Pencil className="mr-1 h-4 w-4" /> Chỉnh sửa
              </Link>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Xóa
            </Button>
          )}
        </div>
      </div>

      {/* Tiêu đề */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TypeIcon className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{customer.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{customer.code}</span>
              <span>·</span>
              <span>{CUSTOMER_TYPE_LABELS[customer.type]}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  CUSTOMER_STATUS_BADGE[customer.status],
                )}
              >
                {CUSTOMER_STATUS_LABELS[customer.status]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field icon={UserIcon} label="Người liên hệ" value={customer.contactPerson} />
            <Field icon={Mail} label="Email" value={customer.email} />
            <Field icon={Phone} label="Số điện thoại" value={customer.phone} />
            <Field icon={Globe} label="Website" value={customer.website} />
            <Field icon={MapPin} label="Tỉnh / Thành phố" value={customer.city} />
            <Field icon={MapPin} label="Địa chỉ" value={customer.address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin doanh nghiệp</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field icon={Hash} label="Mã số thuế" value={customer.taxCode} />
            <Field icon={Briefcase} label="Lĩnh vực / Ngành" value={customer.industry} />
            <Field
              icon={FileText}
              label="Nguồn"
              value={customer.source ? CUSTOMER_SOURCE_LABELS[customer.source] : null}
            />
            <Field
              icon={UserCheck}
              label="Người phụ trách"
              value={customer.assignedTo?.fullName}
            />
            <Field icon={Calendar} label="Ngày tạo" value={formatDate(customer.createdAt)} />
            <Field
              icon={Calendar}
              label="Cập nhật gần nhất"
              value={formatDate(customer.updatedAt)}
            />
          </CardContent>
        </Card>
      </div>

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ghi chú</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {customer.notes}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa khách hàng</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc chắn muốn xóa khách hàng{' '}
            <span className="font-semibold text-foreground">{customer.name}</span> (
            {customer.code})?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDelete(false)}
              disabled={deleting}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
