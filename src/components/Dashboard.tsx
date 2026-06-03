import { formatNumber, formatRmb, formatUsd } from '@/lib/format';
import type { Summary } from '@/types';

interface DashboardProps {
  summary: Summary;
}

export function Dashboard({ summary }: DashboardProps) {
  return (
    <div className="rounded-lg border-2 border-amber-300 bg-ledger-summary p-4 shadow-sm dark:border-amber-600 dark:bg-amber-950/40">
      <div className="mb-3 text-center text-sm font-bold text-slate-800 dark:text-amber-100">
        未结汇总 / 总额
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-slate-700 dark:text-slate-300">未结金额（元）</span>
          <span className="font-bold text-ledger-unsettledText">
            {formatNumber(summary.unsettledRmb)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-700 dark:text-slate-300">折合 USTD</span>
          <span className="font-bold text-ledger-unsettledText">
            {formatUsd(summary.unsettledUsd)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-700 dark:text-slate-300">已结金额（元）</span>
          <span className="font-bold text-ledger-settledText">
            {formatNumber(summary.settledRmb)}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-slate-700 dark:text-slate-300">总计（元）</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {formatNumber(summary.totalRmb)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function FooterSummary({ summary }: DashboardProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900 md:grid-cols-4">
      <div>
        <div className="text-slate-500 dark:text-slate-400">总金额</div>
        <div className="text-lg font-bold">{formatRmb(summary.totalRmb)}</div>
      </div>
      <div>
        <div className="text-slate-500 dark:text-slate-400">已结金额</div>
        <div className="text-lg font-bold text-ledger-settledText">
          {formatRmb(summary.settledRmb)}
        </div>
      </div>
      <div>
        <div className="text-slate-500 dark:text-slate-400">未结金额</div>
        <div className="text-lg font-bold text-ledger-unsettledText">
          {formatRmb(summary.unsettledRmb)}
        </div>
      </div>
      <div>
        <div className="text-slate-500 dark:text-slate-400">未结折合 USD</div>
        <div className="text-lg font-bold text-ledger-unsettledText">
          {formatUsd(summary.unsettledUsd)}
        </div>
      </div>
    </div>
  );
}
