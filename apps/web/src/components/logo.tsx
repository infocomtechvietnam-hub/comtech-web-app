import { cn } from '@/lib/utils';

export function Logo({
  className,
  iconOnly = false,
  showText,
  variant = 'default',
}: {
  className?: string;
  iconOnly?: boolean;
  /** Hiển thị chữ bên cạnh icon (mặc định: true, trừ khi iconOnly) */
  showText?: boolean;
  /** 'light' dùng cho nền tối (sidebar) */
  variant?: 'default' | 'light';
}) {
  const withText = showText ?? !iconOnly;
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-white shadow-sm">
        C
      </div>
      {withText && (
        <span
          className={cn(
            'text-lg font-bold tracking-tight',
            variant === 'light' ? 'text-white' : 'text-foreground',
          )}
        >
          COMTECH <span className="text-primary">CRM</span>
        </span>
      )}
    </div>
  );
}
