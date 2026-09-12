'use client';

import { useAuth } from '@/lib/auth-context';
import { ROLE_LABELS } from '@/lib/nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b py-3 last:border-0 sm:flex-row sm:items-center">
      <span className="w-48 shrink-0 text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{value ?? '—'}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  const initials = user.fullName
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Hồ sơ cá nhân</h2>
        <p className="text-muted-foreground">Thông tin tài khoản của bạn.</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
            {initials}
          </span>
          <div>
            <p className="text-lg font-semibold">{user.fullName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {user.roles.map((r) => (
                <Badge key={r} className="bg-primary/10 text-primary">
                  {ROLE_LABELS[r] ?? r}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin nhân viên</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Row label="Mã nhân viên" value={user.employee?.code} />
          <Row label="Họ và tên" value={user.fullName} />
          <Row label="Email" value={user.email} />
          <Row label="Chức danh" value={user.employee?.jobTitle} />
          <Row
            label="Vai trò"
            value={user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
          />
          <Row
            label="Quyền hạn"
            value={`${user.permissions?.length ?? 0} quyền`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
