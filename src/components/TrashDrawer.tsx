import { useState } from 'react';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { useLedgerStore } from '@/store/useLedgerStore';
import { formatDateChinese, formatRmb } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface TrashDrawerProps {
  open: boolean;
  onClose: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  if (days > 0) return `${days} 天前删除`;
  if (hours > 0) return `${hours} 小时前删除`;
  return `${minutes} 分钟前删除`;
}

function daysLeft(iso: string): number {
  const diff = 30 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(iso).getTime());
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function TrashDrawer({ open, onClose }: TrashDrawerProps) {
  const getDeletedRecords = useLedgerStore((s) => s.getDeletedRecords);
  const restoreRecord = useLedgerStore((s) => s.restoreRecord);
  const permanentlyDeleteRecord = useLedgerStore((s) => s.permanentlyDeleteRecord);

  const [confirmPerm, setConfirmPerm] = useState<string | null>(null);
  const [confirmPermAll, setConfirmPermAll] = useState(false);

  const deleted = getDeletedRecords();

  const handlePermDelete = (id: string) => {
    permanentlyDeleteRecord(id);
    setConfirmPerm(null);
  };

  const handlePermDeleteAll = () => {
    deleted.forEach((r) => permanentlyDeleteRecord(r.id));
    setConfirmPermAll(false);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-start justify-end p-4" onClick={onClose}>
        <div
          className="relative z-50 mt-16 flex h-[80vh] w-full max-w-xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <h2 className="text-base font-semibold">回收站</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
                {deleted.length} 条记录
              </span>
            </div>
            <div className="flex items-center gap-2">
              {deleted.length > 0 && (
                <Button variant="danger" size="sm" onClick={() => setConfirmPermAll(true)}>
                  清空回收站
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Hint */}
          <div className="flex items-center gap-2 bg-amber-50 px-5 py-2 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            删除的记录保留 30 天，到期后将自动永久删除
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {deleted.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
                <Trash2 className="h-10 w-10 opacity-30" />
                <p className="text-sm">回收站为空</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {deleted.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.client}</span>
                        <span className="text-xs text-slate-400">{r.type}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {formatRmb(r.amount)}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                        <span>{formatDateChinese(r.date)}</span>
                        <span>·</span>
                        <span>{timeAgo(r.deletedAt!)}</span>
                        <span>·</span>
                        <span className={daysLeft(r.deletedAt!) <= 3 ? 'text-red-500 font-medium' : ''}>
                          剩余 {daysLeft(r.deletedAt!)} 天
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreRecord(r.id)}
                        title="恢复"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        恢复
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => setConfirmPerm(r.id)}
                        title="永久删除"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmPerm !== null}
        onClose={() => setConfirmPerm(null)}
        onConfirm={() => confirmPerm && handlePermDelete(confirmPerm)}
        title="永久删除"
        description="此操作无法撤销，记录将被彻底删除，无法找回。确定要继续吗？"
        confirmLabel="永久删除"
        variant="danger"
      />

      <ConfirmDialog
        open={confirmPermAll}
        onClose={() => setConfirmPermAll(false)}
        onConfirm={handlePermDeleteAll}
        title="清空回收站"
        description={`将永久删除全部 ${deleted.length} 条记录，此操作无法撤销。确定要继续吗？`}
        confirmLabel="全部删除"
        variant="danger"
      />
    </>
  );
}
