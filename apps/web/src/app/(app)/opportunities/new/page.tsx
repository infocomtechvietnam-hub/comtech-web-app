'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { DealForm } from '@/components/deal-form';
import { Button } from '@/components/ui/button';

export default function NewOpportunityPage() {
  const { hasRole } = useAuth();
  const canCreate = hasRole('admin', 'manager', 'employee');

  if (!canCreate) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Không có quyền truy cập</h2>
        <p className="text-muted-foreground">
          Bạn không có quyền tạo cơ hội mới.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/opportunities">
            <ArrowLeft className="mr-1 h-4 w-4" /> Danh sách
          </Link>
        </Button>
      </div>
      <div>
        <h2 className="text-2xl font-bold">Thêm cơ hội mới</h2>
        <p className="text-muted-foreground">
          Nhập thông tin để tạo cơ hội bán hàng mới.
        </p>
      </div>
      <DealForm mode="create" />
    </div>
  );
}
