'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUser, LoginResponse } from '@comtech/types';
import { api, setAccessToken, getAccessToken } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadMe = useCallback(async () => {
    try {
      const me = await api.get<AuthUser>('/users/me');
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Nếu chưa có access token trong session → thử refresh từ cookie
      if (!getAccessToken()) {
        await api.refresh();
      }
      if (getAccessToken()) {
        await loadMe();
      }
      setLoading(false);
    })();
  }, [loadMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });
      setAccessToken(res.accessToken);
      setUser(res.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* bỏ qua */
    }
    setAccessToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const hasRole = useCallback(
    (...roles: string[]) => roles.some((r) => user?.roles?.includes(r as any)),
    [user],
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, refreshMe: loadMe, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider');
  return ctx;
}
