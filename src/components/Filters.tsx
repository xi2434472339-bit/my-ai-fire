import { useRef } from "react";
import { Search, RotateCcw, X, ChevronDown } from "lucide-react";
import { useLedgerStore } from "@/store/useLedgerStore";
import { normalizeKnownClients } from "@/lib/clientNames";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";


export function Filters() {
  const filters = useLedgerStore((s) => s.filters);
  const knownClients = useLedgerStore((s) => s.knownClients);
  const setFilters = useLedgerStore((s) => s.setFilters);
  const resetFilters = useLedgerStore((s) => s.resetFilters);

  const hasSearch = filters.search.trim() !== "";
  const hasClient = filters.client.trim() !== "";
  const hasStatus = filters.status !== "";
  const hasDateFrom = filters.dateFrom !== "";
  const hasDateTo = filters.dateTo !== "";
  const clientOptions = normalizeKnownClients(knownClients);

  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1.5">
        <Label>搜索</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-8 pr-8"
            placeholder="客户、类型、备注..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
          {hasSearch && (
            <button
              type="button"
              className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              onClick={() => setFilters({ search: "" })}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>客户搜索</Label>
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <Input
              list="filter-client-list"
              placeholder="输入客户名筛选"
              className="pr-16"
              value={filters.client}
              onChange={(e) => setFilters({ client: e.target.value })}
            />
            <span className="pointer-events-none absolute right-2 top-2.5 text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </span>
          </div>
          {hasClient && (
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              onClick={() => setFilters({ client: "" })}
              title="清空客户筛选"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <datalist id="filter-client-list">
          {clientOptions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="space-y-1.5">
        <Label>状态</Label>
        <div className="flex items-center gap-1">
          <Select
            className="flex-1"
            value={filters.status}
            onChange={(e) =>
              setFilters({ status: e.target.value as "" | "已结账" | "未结" })
            }
          >
            <option value="">全部状态</option>
            <option value="已结账">已结账</option>
            <option value="未结">未结</option>
          </Select>
          {hasStatus && (
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              onClick={() => setFilters({ status: "" })}
              title="清空状态筛选"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>开始日期</Label>
        <div className="relative">
          <Input
            type="date"
            className="pr-8"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ dateFrom: e.target.value })}
          />
          {hasDateFrom && (
            <button
              type="button"
              className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              onClick={() => setFilters({ dateFrom: "" })}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>结束日期</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="date"
              className="pr-8"
              value={filters.dateTo}
              onChange={(e) => setFilters({ dateTo: e.target.value })}
            />
            {hasDateTo && (
              <button
                type="button"
                className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onClick={() => setFilters({ dateTo: "" })}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button variant="outline" size="icon" onClick={resetFilters} title="重置筛选">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ExchangeRateSetting() {
  const exchangeRate = useLedgerStore((s) => s.exchangeRate);
  const setExchangeRate = useLedgerStore((s) => s.setExchangeRate);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2 text-sm">
      <Label className="whitespace-nowrap">汇率 (RMB→USD)</Label>
      <Input
        ref={inputRef}
        type="number"
        min={0.01}
        step={0.01}
        className="w-24"
        defaultValue={exchangeRate}
        key={exchangeRate}
        onBlur={(e) => {
          const val = parseFloat(e.target.value);
          if (!isNaN(val) && val > 0) setExchangeRate(val);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") inputRef.current?.blur();
        }}
      />
      <span className="text-slate-500 dark:text-slate-400">1 USD = ? RMB</span>
    </div>
  );
}

