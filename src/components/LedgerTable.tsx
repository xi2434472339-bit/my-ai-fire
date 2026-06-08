import { useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Trash2,
  Pencil,
} from 'lucide-react';
import { useLedgerStore } from '@/store/useLedgerStore';
import { formatDateChinese, formatRmb, formatUsd } from '@/lib/format';
import type { LedgerRecord, SortField } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface LedgerTableProps {
  records: LedgerRecord[];
  onEdit: (record: LedgerRecord) => void;
}

const COLUMNS: { key: SortField | 'notes' | 'select' | 'actions'; label: string; sortable?: boolean }[] = [
  { key: 'select', label: '', sortable: false },
  { key: 'client', label: '客户', sortable: true },
  { key: 'date', label: '日期', sortable: true },
  { key: 'type', label: '类型', sortable: true },
  { key: 'quantity', label: '数量', sortable: true },
  { key: 'unitPrice', label: '单价', sortable: true },
  { key: 'amount', label: '金额', sortable: true },
  { key: 'usd', label: 'USDT', sortable: true },
  { key: 'status', label: '状态', sortable: true },
  { key: 'channel', label: '渠道', sortable: true },
  { key: 'notes', label: '备注', sortable: false },
  { key: 'actions', label: '操作', sortable: false },
];

const CENTERED_COLUMNS = new Set<SortField>([
  'date',
  'quantity',
  'unitPrice',
  'amount',
  'usd',
]);

const COLUMN_WIDTHS: Partial<Record<(typeof COLUMNS)[number]['key'], string>> = {
  select: 'w-9',
  client: 'w-[8%]',
  date: 'w-[12%]',
  type: 'w-[8%]',
  quantity: 'w-[6%]',
  unitPrice: 'w-[7%]',
  amount: 'w-[10%]',
  usd: 'w-[8%]',
  status: 'w-[8%]',
  channel: 'w-[9%]',
  notes: 'w-[8%]',
  actions: 'w-[10%]',
};

function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
  return direction === 'asc' ? (
    <ArrowUp className="ml-1 inline h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3" />
  );
}

export function LedgerTable({ records, onEdit }: LedgerTableProps) {
  const sortField = useLedgerStore((s) => s.sortField);
  const sortDirection = useLedgerStore((s) => s.sortDirection);
  const selectedIds = useLedgerStore((s) => s.selectedIds);
  const setSort = useLedgerStore((s) => s.setSort);
  const toggleSelect = useLedgerStore((s) => s.toggleSelect);
  const selectAll = useLedgerStore((s) => s.selectAll);
  const clearSelection = useLedgerStore((s) => s.clearSelection);
  const deleteRecord = useLedgerStore((s) => s.deleteRecord);
  const settleRecord = useLedgerStore((s) => s.settleRecord);

  const [deleteTarget, setDeleteTarget] = useState<LedgerRecord | null>(null);
  const [settleTarget, setSettleTarget] = useState<LedgerRecord | null>(null);

  const allIds = records.map((r) => r.id);
  const allSelected = records.length > 0 && records.every((r) => selectedIds.includes(r.id));

  const handleSelectAll = () => {
    if (allSelected) clearSelection();
    else selectAll(allIds);
  };

  const rowClass = (status: string) =>
    status === '已结账'
      ? 'bg-ledger-settled text-ledger-settledText dark:bg-pink-950/30 dark:text-pink-300'
      : 'bg-ledger-unsettled text-ledger-unsettledText dark:bg-green-950/30 dark:text-green-300';

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-700">
        <div className="overflow-hidden">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="bg-ledger-header text-white">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap px-2 py-2.5 text-left font-semibold',
                      col.sortable && 'cursor-pointer select-none hover:bg-blue-900/50',
                      COLUMN_WIDTHS[col.key],
                      col.key !== 'notes'
                        && col.key !== 'select'
                        && col.key !== 'actions'
                        && CENTERED_COLUMNS.has(col.key as SortField)
                        && 'text-center',
                      col.key === 'select' && 'w-10 text-center',
                      col.key === 'actions' && 'text-center',
                    )}
                    onClick={() => {
                      if (col.sortable && col.key !== 'notes' && col.key !== 'select' && col.key !== 'actions') {
                        setSort(col.key as SortField);
                      }
                    }}
                  >
                    {col.key === 'select' ? (
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded"
                        aria-label="全选"
                      />
                    ) : (
                      <>
                        {col.label}
                        {col.sortable && (
                          <SortIcon
                            active={sortField === col.key}
                            direction={sortDirection}
                          />
                        )}
                      </>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-slate-500">
                    暂无数据，点击「新增记录」开始记账
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record.id}
                    className={cn(
                      'border-t border-slate-200/60 transition-colors dark:border-slate-700/60',
                      rowClass(record.status),
                      selectedIds.includes(record.id) && 'ring-2 ring-inset ring-blue-400',
                    )}
                  >
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={() => toggleSelect(record.id)}
                        className="h-4 w-4 rounded"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">{record.client}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-center">{formatDateChinese(record.date)}</td>
                    <td className="px-3 py-2">{record.type}</td>
                    <td className="px-2 py-2 text-center">{record.quantity}</td>
                    <td className="px-2 py-2 text-center">{record.unitPrice}</td>
                    <td className="px-2 py-2 text-center font-semibold">{formatRmb(record.amount)}</td>
                    <td className="px-2 py-2 text-center">{formatUsd(record.usd)}</td>
                    <td className="px-2 py-2">
                      <span
                        className={cn(
                          'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                          record.status === '已结账'
                            ? 'bg-pink-200 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
                            : 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200',
                        )}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="truncate px-2 py-2" title={record.channel || '未安排'}>
                      {record.channel ? (
                        <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {record.channel}
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                          未安排
                        </span>
                      )}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2" title={record.notes}>
                      {record.notes}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {record.status === '未结' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-green-700 hover:bg-green-100 dark:text-green-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSettleTarget(record);
                            }}
                            title="一键结账"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onEdit(record)}
                          title="编辑"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => setDeleteTarget(record)}
                          title="删除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteRecord(deleteTarget.id)}
        title="删除记录"
        description={deleteTarget ? `确定要删除「${deleteTarget.client}」的这条记录吗？删除后可在回收站找回，30 天内有效。` : ''}
        confirmLabel="移入回收站"
        variant="danger"
      />

      <ConfirmDialog
        open={settleTarget !== null}
        onClose={() => setSettleTarget(null)}
        onConfirm={() => settleTarget && settleRecord(settleTarget.id)}
        title="确认结账"
        description={settleTarget ? `确定要将「${settleTarget.client}」的这条记录标记为已结账吗？结账后状态无法撤销。` : ''}
        confirmLabel="确认结账"
        variant="warning"
      />
    </>
  );
}
