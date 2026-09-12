'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, GripVertical, User2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Deal, DealPipelineColumn, DealStage } from '@comtech/types';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  DEAL_STAGE_ACCENT,
  DEAL_STAGE_LABELS,
  KANBAN_STAGES,
  formatCurrencyShort,
} from '@/lib/deals';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PendingMove {
  deal: Deal;
  toStage: DealStage;
}

export function DealKanban({
  canMove,
  onChanged,
}: {
  canMove: boolean;
  onChanged?: () => void;
}) {
  const [columns, setColumns] = useState<DealPipelineColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<DealStage | null>(null);
  const [pendingLost, setPendingLost] = useState<PendingMove | null>(null);
  const [lostReason, setLostReason] = useState('');
  const [moving, setMoving] = useState(false);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<DealPipelineColumn[]>('/deals/pipeline');
      setColumns(res);
    } catch (err: any) {
      toast.error(err?.message ?? 'Không thể tải bảng Kanban.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  function findDeal(id: string): Deal | undefined {
    for (const col of columns) {
      const d = col.deals.find((x) => x.id === id);
      if (d) return d;
    }
    return undefined;
  }

  async function doMove(dealId: string, toStage: DealStage, reason?: string) {
    setMoving(true);
    try {
      await api.patch(`/deals/${dealId}/stage`, {
        stage: toStage,
        lostReason: reason,
      });
      toast.success(`Đã chuyển sang "${DEAL_STAGE_LABELS[toStage]}".`);
      setPendingLost(null);
      setLostReason('');
      await fetchPipeline();
      onChanged?.();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'Không thể chuyển giai đoạn.';
      toast.error(msg);
    } finally {
      setMoving(false);
    }
  }

  function handleDrop(toStage: DealStage) {
    setOverStage(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const deal = findDeal(id);
    if (!deal || deal.stage === toStage) return;
    if (toStage === 'closed_lost') {
      setPendingLost({ deal, toStage });
      setLostReason('');
      return;
    }
    doMove(id, toStage);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_STAGES.map((stage) => {
          const col = columns.find((c) => c.stage === stage);
          const deals = col?.deals ?? [];
          return (
            <div
              key={stage}
              className={cn(
                'flex w-72 shrink-0 flex-col rounded-lg border border-t-4 bg-muted/30',
                DEAL_STAGE_ACCENT[stage],
                overStage === stage && canMove && 'ring-2 ring-primary',
              )}
              onDragOver={(e) => {
                if (!canMove) return;
                e.preventDefault();
                setOverStage(stage);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={() => canMove && handleDrop(stage)}
            >
              <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-sm font-semibold">
                  {DEAL_STAGE_LABELS[stage]}
                </span>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  {col?.count ?? 0}
                </span>
              </div>
              <div className="px-3 py-1 text-xs text-muted-foreground">
                {formatCurrencyShort(col?.value ?? 0)}
              </div>
              <div className="flex min-h-[120px] flex-1 flex-col gap-2 p-2">
                {deals.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground/60">
                    Chưa có cơ hội
                  </p>
                ) : (
                  deals.map((d) => (
                    <div
                      key={d.id}
                      draggable={canMove}
                      onDragStart={() => setDragId(d.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStage(null);
                      }}
                      className={cn(
                        'group rounded-md border bg-background p-3 shadow-sm transition',
                        canMove && 'cursor-grab active:cursor-grabbing hover:shadow',
                        dragId === d.id && 'opacity-50',
                      )}
                    >
                      <div className="flex items-start gap-1">
                        {canMove && (
                          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                        )}
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/opportunities/${d.id}`}
                            className="line-clamp-2 text-sm font-medium hover:text-primary hover:underline"
                          >
                            {d.name}
                          </Link>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {d.customer?.name ?? '—'}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-primary">
                              {formatCurrencyShort(d.value)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {d.probability}%
                            </span>
                          </div>
                          {d.assignedTo && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <User2 className="h-3 w-3" />
                              <span className="truncate">
                                {d.assignedTo.fullName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!pendingLost}
        onOpenChange={(o) => !o && setPendingLost(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Đánh dấu cơ hội thất bại</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn đang chuyển cơ hội{' '}
            <span className="font-semibold text-foreground">
              {pendingLost?.deal.name}
            </span>{' '}
            sang giai đoạn <b>Thất bại</b>. Vui lòng cho biết lý do (không bắt buộc).
          </p>
          <div className="space-y-2">
            <Label htmlFor="lostReason">Lý do thất bại</Label>
            <Textarea
              id="lostReason"
              value={lostReason}
              placeholder="VD: Khách chọn nhà cung cấp khác, ngân sách không đủ..."
              onChange={(e) => setLostReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingLost(null)}
              disabled={moving}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={moving}
              onClick={() =>
                pendingLost &&
                doMove(
                  pendingLost.deal.id,
                  pendingLost.toStage,
                  lostReason.trim() || undefined,
                )
              }
            >
              {moving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
