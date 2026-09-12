import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware định tuyến cơ bản dựa trên sự hiện diện của refresh cookie.
 * Lưu ý: access token nằm trong sessionStorage (không đọc được ở middleware),
 * nên việc bảo vệ chi tiết được thực hiện ở client (app)/layout.tsx.
 * Ở đây chỉ chuyển hướng nhanh giữa /login và khu vực ứng dụng.
 */
const REFRESH_COOKIE = 'comtech_refresh';

const AUTH_PATHS = ['/login', '/forgot-password', '/reset-password'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(REFRESH_COOKIE);
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Nếu đã có phiên mà vào trang đăng nhập → chuyển tới dashboard
  if (hasSession && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/forgot-password', '/reset-password'],
};
