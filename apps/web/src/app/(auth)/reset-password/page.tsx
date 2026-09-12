'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error('Liên kết không hợp lệ hoặc đã hết hạn.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirm) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err?.message ?? 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Logo className="h-12 w-auto" />
      </div>
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <h1 className="mb-1 text-xl font-semibold">Đặt lại mật khẩu</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Nhập mật khẩu mới cho tài khoản của bạn.
          </p>
          {!token && (
            <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              Liên kết không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu mới.
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={show ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Xác nhận mật khẩu</Label>
              <Input
                id="confirm"
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading || !token}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Đặt lại mật khẩu
            </Button>
          </form>
          <Link
            href="/login"
            className="mt-6 block text-center text-sm font-medium text-primary hover:underline"
          >
            Quay lại đăng nhập
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-primary" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
