'use client';

import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS } from '@/lib/nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users2, Target, ClipboardList, Building2 } from 'lucide-react';

const STATS = [
  { label: 'Khách hàng', value: '—', icon: Users2, color: 'text-blue-600 bg-blue-50' },
  { label: 'Cơ hội', value: '—', icon: Target, color: 'text-amber-600 bg-amber-50' },
  { label: 'Công việc', value: '—', icon: ClipboardList, color: 'text-green-600 bg-green-50' },
  { label: 'Phòng ban', value: '—', icon: Building2, color: 'text-purple-600 bg-purple-50' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          Chào mừng, {user?.fullName}! 👋
        </h2>
        <p className="text-muted-foreground">
          Vai trò: {user?.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${s.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bảng điều khiển</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Đây là màn hình tổng quan (Milestone 1). Các số liệu và biểu đồ chi tiết
            sẽ được bổ sung ở các giai đoạn tiếp theo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
