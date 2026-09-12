'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Target,
  Trophy,
  Percent,
  Loader2,
} from 'lucide-react';
import type { DealStats } from '@comtech/types';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  DEAL_STAGE_BAR,
  DEAL_STAGE_LABELS,
  formatCurrencyShort,
} from '@/lib/deals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DealStatsPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [stats, setStats] = useState<DealStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<DealStats>('/deals/stats')
      .then((s) => {
        if (active) setStats(s);
      })
      .catch(() => {
        if (active) setStats(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: 'Cơ hội đang mở',
      value: String(stats.totalOpen),
      sub: formatCurrencyShort(stats.totalOpenValue),
      icon: Target,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Dự báo doanh thu',
      value: formatCurrencyShort(stats.weightedForecast),
      sub: 'Theo trọng số xác suất',
      icon: TrendingUp,
      color: 'text-primary bg-orange-50',
    },
    {
      label: 'Đã thắng',
      value: String(stats.wonCount),
      sub: formatCurrencyShort(stats.wonValue),
      icon: Trophy,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Tỷ lệ chuyển đổi',
      value: `${stats.conversionRate}%`,
      sub: `Thắng ${stats.wonCount} / Mất ${stats.lostCount}`,
      icon: Percent,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  const maxStageValue = Math.max(
    1,
    ...stats.byStage.map((s) => s.value),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn('rounded-lg p-3', c.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="truncate text-xl font-bold">{c.value}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.sub}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phễu bán hàng theo giai đoạn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.byStage.map((s) => (
            <div key={s.stage} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{DEAL_STAGE_LABELS[s.stage]}</span>
                <span className="text-muted-foreground">
                  {s.count} cơ hội · {formatCurrencyShort(s.value)}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', DEAL_STAGE_BAR[s.stage])}
                  style={{
                    width: `${Math.max(2, (s.value / maxStageValue) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
