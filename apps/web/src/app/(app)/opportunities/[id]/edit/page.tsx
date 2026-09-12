'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { Deal } from '@comtech/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { DealForm } from '@/components/deal-form';
import { Button } from '@/components/ui/button';

export default function EditOpportunityPage() {
  const params = useParams();
  const id = params?.id as string;
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'manager', 'employee');

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id || !canEdit) return;
    setLoading(true);
    api
      .get<Deal>(`/deals/${id}`)
      .then((d) => setDeal(d))
      .catch((err) => {
        setNotFound(true);
        toast.error(err?.message ?? 'Không tìm thấy cơ hội.');
      })
      .finally(() => setLoading(false));
  }, [id, canEdit]);

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Không có quyền truy cập</h2>
        <p className="text-muted-foreground">
          Bạn không có quyền chỉnh sửa cơ hội.
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/opportunities/${deal.id}`}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Chi tiết
          </Link>
        </Button>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Chỉnh sửa cơ hội</h2>
        <p className="text-muted-foreground">
          {deal.name} · <span className="font-mono">{deal.code}</span>
        </p>
      </div>
      <DealForm mode="edit" deal={deal} />
    </div>
  );
}
