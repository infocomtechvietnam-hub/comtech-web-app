/**
 * API client cho COMTECH CRM.
 * - Access token lưu trong bộ nhớ (module scope) + sessionStorage để giữ qua reload.
 * - Tự động refresh khi gặp 401 (dùng refresh token trong HttpOnly cookie).
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) sessionStorage.setItem('comtech_access', token);
    else sessionStorage.removeItem('comtech_access');
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    accessToken = sessionStorage.getItem('comtech_access');
  }
  return accessToken;
}

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

function extractMessage(body: any, fallback: string): string {
  if (!body) return fallback;
  if (typeof body.message === 'string') return body.message;
  if (Array.isArray(body.message)) return body.message.join(' ');
  return fallback;
}

async function rawRequest<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && retry && path !== '/auth/refresh' && path !== '/auth/login') {
    // Thử refresh 1 lần
    const refreshed = await tryRefresh();
    if (refreshed) {
      return rawRequest<T>(path, options, false);
    }
  }

  let body: any = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(
      extractMessage(body, 'Đã xảy ra lỗi. Vui lòng thử lại.'),
      res.status,
    );
  }

  return body as T;
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string) => rawRequest<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: any) =>
    rawRequest<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: any) =>
    rawRequest<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  refresh: tryRefresh,
};
