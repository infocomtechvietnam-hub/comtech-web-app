'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type {
  Deal,
  DealAssignee,
  DealCustomerRef,
  DealSource,
  DealStage,
  CreateDealRequest,
} from '@comtech/types';
import { api, ApiError } from '@/lib/api';
import {
  DEAL_SOURCE_LABELS,
  DEAL_SOURCE_OPTIONS,
  DEAL_STAGE_LABELS,
  DEAL_STAGE_OPTIONS,
  STAGE_PROBABILITY,
} from '@/lib/deals';
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
  customerId: string;
  value: string;
  probability: string;
  stage: DealStage;
  source: DealSource | '';
  expectedCloseDate: string;
  assignedToId: string;
  description: string;
}

function toDateInput(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function initialFromDeal(d?: Deal | null): FormState {
  return {
    name: d?.name ?? '',
    customerId: d?.customerId ?? '',
    value: d?.value != null ? String(d.value) : '',
    probability: d?.probability != null ? String(d.probability) : '',
    stage: d?.stage ?? 'prospecting',
    source: d?.source ?? '',
    expectedCloseDate: toDateInput(d?.expectedCloseDate),
    assignedToId: d?.assignedToId ?? '',
    description: d?.description ?? '',
  };
}

export function DealForm({
  deal,
  mode,
}: {
  deal?: Deal | null;
  mode: 'create' | 'edit';
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialFromDeal(deal));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<DealCustomerRef[]>([]);
  const [assignees, setAssignees] = useState<DealAssignee[]>([]);
  const [probabilityTouched, setProbabilityTouched] = useState(false);

  useEffect(() => {
    api
      .get<DealCustomerRef[]>('/deals/customers')
      .then(setCustomers)
      .catch(() => setCustomers([]));
    api
      .get<DealAssignee[]>('/deals/assignees')
      .then(setAssignees)
      .catch(() => setAssignees([]));
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Khi đổi giai đoạn, tự gợi ý xác suất nếu người dùng chưa chỉnh tay
  function handleStageChange(stage: DealStage) {
    setForm((f) => ({
      ...f,
      stage,
      probability: probabilityTouched
        ? f.probability
        : String(STAGE_PROBABILITY[stage]),
    }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập tên cơ hội.';
    else if (form.name.trim().length < 2) e.name = 'Tên cơ hội quá ngắn.';
    if (!form.customerId) e.customerId = 'Vui lòng chọn khách hàng.';
    if (form.value && Number(form.value) < 0)
      e.value = 'Giá trị không hợp lệ.';
    if (form.probability) {
      const p = Number(form.probability);
      if (Number.isNaN(p) || p < 0 || p > 100)
        e.probability = 'Xác suất phải từ 0 đến 100.';
    }
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

    const payload: CreateDealRequest = {
      name: form.name.trim(),
      customerId: form.customerId,
      value: form.value ? Number(form.value) : undefined,
      probability: form.probability ? Number(form.probability) : undefined,
      stage: form.stage,
      source: form.source || undefined,
      expectedCloseDate: form.expectedCloseDate || undefined,
      assignedToId: form.assignedToId || undefined,
      description: form.description.trim() || undefined,
    };

    try {
      if (mode === 'create') {
        const created = await api.post<Deal>('/deals', payload);
        toast.success('Tạo cơ hội bán hàng thành công!');
        router.push(`/opportunities/${created.id}`);
      } else if (deal) {
        const updated = await api.patch<Deal>(`/deals/${deal.id}`, {
          ...payload,
          description: form.description.trim(),
          assignedToId: form.assignedToId || undefined,
        });
        toast.success('Cập nhật cơ hội thành công!');
        router.push(`/opportunities/${updated.id}`);
      }
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Không thể lưu cơ hội. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cơ hội</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Tên cơ hội *</Label>
            <Input
              id="name"
              value={form.name}
              placeholder="VD: Triển khai hệ thống CRM cho công ty ABC"
              onChange={(e) => set('name', e.target.value)}
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Khách hàng *</Label>
            <Select
              value={form.customerId || undefined}
              onValueChange={(v) => set('customerId', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn khách hàng" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && (
              <p className="text-xs text-red-600">{errors.customerId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Giá trị (VND)</Label>
            <Input
              id="value"
              type="number"
              min={0}
              value={form.value}
              placeholder="VD: 150000000"
              onChange={(e) => set('value', e.target.value)}
            />
            {errors.value && (
              <p className="text-xs text-red-600">{errors.value}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="probability">Xác suất thắng (%)</Label>
            <Input
              id="probability"
              type="number"
              min={0}
              max={100}
              value={form.probability}
              placeholder="0 - 100"
              onChange={(e) => {
                setProbabilityTouched(true);
                set('probability', e.target.value);
              }}
            />
            {errors.probability && (
              <p className="text-xs text-red-600">{errors.probability}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Giai đoạn</Label>
            <Select
              value={form.stage}
              onValueChange={(v) => handleStageChange(v as DealStage)}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate">Ngày dự kiến chốt</Label>
            <Input
              id="expectedCloseDate"
              type="date"
              value={form.expectedCloseDate}
              onChange={(e) => set('expectedCloseDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Nguồn cơ hội</Label>
            <Select
              value={form.source || NONE}
              onValueChange={(v) =>
                set('source', v === NONE ? '' : (v as DealSource))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn nguồn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>— Không xác định —</SelectItem>
                {DEAL_SOURCE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {DEAL_SOURCE_LABELS[s]}
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
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={form.description}
              placeholder="Mô tả chi tiết về cơ hội bán hàng"
              onChange={(e) => set('description', e.target.value)}
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
          {mode === 'create' ? 'Tạo cơ hội' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
