'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  X,
  Bell,
  LogOut,
  ChevronLeft,
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { visibleNavItems, ROLE_LABELS } from '@/lib/nav';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const navItems = visibleNavItems(user.roles);
  const initials = user.fullName
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
        <Logo className="h-8 w-auto" variant="light" showText={!collapsed} />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="hidden items-center justify-center gap-2 border-t border-white/10 p-3 text-sm text-sidebar-foreground/70 hover:text-white lg:flex"
      >
        <ChevronLeft
          className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
        />
        {!collapsed && <span>Thu gọn</span>}
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 bg-sidebar text-sidebar-foreground transition-all lg:block',
          collapsed ? 'w-20' : 'w-64',
        )}
      >
        {SidebarContent}
      </aside>

      {/* Sidebar mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar text-sidebar-foreground">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 text-white/70 hover:text-white"
              aria-label="Đóng menu"
            >
              <X className="h-5 w-5" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Mở menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold">
              {navItems.find(
                (i) => pathname === i.href || pathname.startsWith(i.href + '/'),
              )?.label ?? 'COMTECH CRM'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="relative rounded-full p-2 text-muted-foreground hover:bg-muted"
              aria-label="Thông báo"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-muted">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {initials}
                </span>
                <span className="hidden text-sm font-medium sm:inline">
                  {user.fullName}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.fullName}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                    <span className="mt-1 text-xs font-normal text-primary">
                      {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ')}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" /> Hồ sơ cá nhân
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
