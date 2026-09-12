'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type {
  Customer,
  CustomerAssignee,
  CustomerSource,
  CustomerStatus,
  CustomerType,
  CreateCustomerRequest,
} from '@comtech/types';
import { api, ApiError } from '@/lib/api';
import {
  CUSTOMER_SOURCE_LABELS,
  CUSTOMER_SOURCE_OPTIONS,
  CUSTOMER_STATUS_LABELS,
  CUSTOMER_STATUS_OPTIONS,
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_TYPE_OPTIONS,
} from '@/lib/customers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE = '__none__';

interface FormState {
  name: string;
  type: CustomerType;
  status: CustomerStatus;
  contactPerson: string;
  email: string;
  phone: string;
  taxCode: string;
  website: string;
  industry: string;
  source: CustomerSource | '';
  city: string;
  address: string;
  assignedToId: string;
  notes: string;
}

function initialFromCustomer(c?: Customer | null): FormState {
  return {
    name: c?.name ?? '',
    type: c?.type ?? 'company',
    status: c?.status ?? 'lead',
    contactPerson: c?.contactPerson ?? '',
    email: c?.email ?? '',
    phone: c?.phone ?? '',
    taxCode: c?.taxCode ?? '',
    website: c?.website ?? '',
    industry: c?.industry ?? '',
    source: c?.source ?? '',
    city: c?.city ?? '',
    address: c?.address ?? '',
    assignedToId: c?.assignedToId ?? '',
    notes: c?.notes ?? '',
  };
}

export function CustomerForm({
  customer,
  mode,
}: {
  customer?: Customer | null;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialFromCustomer(customer));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [assignees, setAssignees] = useState<CustomerAssignee[]>([]);

  useEffect(() => {
    api
      .get<CustomerAssignee[]>('/customers/assignees')
      .then(setAssignees)
      .catch(() => setAssignees([]));
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập tên khách hàng.';
    else if (form.name.trim().length < 2) e.name = 'Tên khách hàng quá ngắn.';
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      e.email = 'Email không hợp lệ.';
    if (form.phone && form.phone.length > 20)
      e.phone = 'Số điện thoại quá dài.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) {
      toast.error('Vui lòng kiểm tra lại thông tin.');
      return;
    }
    setSaving(true);

    const payload: CreateCustomerRequest = {
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      contactPerson: form.contactPerson.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      taxCode: form.taxCode.trim() || undefined,
      website: form.website.trim() || undefined,
      industry: form.industry.trim() || undefined,
      source: form.source || undefined,
      city: form.city.trim() || undefined,
      address: form.address.trim() || undefined,
      assignedToId: form.assignedToId || undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      if (mode === 'create') {
        const created = await api.post<Customer>('/customers', payload);
        toast.success('Tạo khách hàng thành công!');
        router.push(`/customers/${created.id}`);
      } else if (customer) {
        // Khi sửa: gửi cả các trường rỗng để cho phép xoá giá trị
        const updated = await api.patch<Customer>(`/customers/${customer.id}`, {
          ...payload,
          contactPerson: form.contactPerson.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          taxCode: form.taxCode.trim(),
          website: form.website.trim(),
          industry: form.industry.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          notes: form.notes.trim(),
          assignedToId: form.assignedToId || undefined,
        });
        toast.success('Cập nhật khách hàng thành công!');
        router.push(`/customers/${updated.id}`);
      }
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Không thể lưu khách hàng. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Tên khách hàng *</Label>
            <Input
              id="name"
              value={form.name}
              placeholder="VD: Công ty TNHH ABC"
              onChange={(e) => set('name', e.target.value)}
            />
            {errors.name && (
              <p className="text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Loại khách hàng *</Label>
            <Select
              value={form.type}
              onValueChange={(v) => set('type', v as CustomerType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {CUSTOMER_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set('status', v as CustomerStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {CUSTOMER_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">Người liên hệ</Label>
            <Input
              id="contactPerson"
              value={form.contactPerson}
              placeholder="Họ tên người liên hệ"
              onChange={(e) => set('contactPerson', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Lĩnh vực / Ngành</Label>
            <Input
              id="industry"
              value={form.industry}
              placeholder="VD: Công nghệ thông tin"
              onChange={(e) => set('industry', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              placeholder="email@example.com"
              onChange={(e) => set('email', e.target.value)}
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              value={form.phone}
              placeholder="VD: 0901234567"
              onChange={(e) => set('phone', e.target.value)}
            />
            {errors.phone && (
              <p className="text-xs text-red-600">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={form.website}
              placeholder="https://..."
              onChange={(e) => set('website', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxCode">Mã số thuế</Label>
            <Input
              id="taxCode"
              value={form.taxCode}
              placeholder="VD: 0312345678"
              onChange={(e) => set('taxCode', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Tỉnh / Thành phố</Label>
            <Input
              id="city"
              value={form.city}
              placeholder="VD: TP. Hồ Chí Minh"
              onChange={(e) => set('city', e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Textarea
              id="address"
              value={form.address}
              placeholder="Địa chỉ chi tiết"
              onChange={(e) => set('address', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phân loại & Phụ trách</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nguồn khách hàng</Label>
            <Select
              value={form.source || NONE}
              onValueChange={(v) =>
                set('source', v === NONE ? '' : (v as CustomerSource))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn nguồn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Không xác định —</SelectItem>
                {CUSTOMER_SOURCE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {CUSTOMER_SOURCE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Người phụ trách</Label>
            <Select
              value={form.assignedToId || NONE}
              onValueChange={(v) => set('assignedToId', v === NONE ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn người phụ trách" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Chưa phân công —</SelectItem>
                {assignees.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.fullName} ({a.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              value={form.notes}
              placeholder="Ghi chú thêm về khách hàng"
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={() => router.back()}
        >
          <X className="mr-1 h-4 w-4" /> Hủy
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1 h-4 w-4" />
          )}
          {mode === 'create' ? 'Tạo khách hàng' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
