'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Vui lòng nhập email.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
      toast.success('Đã gửi hướng dẫn đặt lại mật khẩu (nếu email tồn tại).');
    } catch (err: any) {
      toast.error(err?.message ?? 'Không thể gửi yêu cầu. Vui lòng thử lại.');
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
          <h1 className="mb-1 text-xl font-semibold">Quên mật khẩu</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Nhập email của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
          </p>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <MailCheck className="h-10 w-10 text-primary" />
              <p className="text-sm">
                Nếu email <span className="font-medium">{email}</span> tồn tại trong hệ thống,
                bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ten@comtech.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gửi yêu cầu
              </Button>
            </form>
          )}
          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
