import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { BookOpen } from 'lucide-react';
import {
  useLedgerStore,
  filterRecords,
  computeSummary,
} from '@/store/useLedgerStore';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useAutoBackup } from '@/hooks/useAutoBackup';
import { Dashboard, FooterSummary } from '@/components/Dashboard';
import { BackupStatus } from '@/components/BackupStatus';
import { Filters, ExchangeRateSetting } from '@/components/Filters';
import { LedgerTable } from '@/components/LedgerTable';
import { RecordForm } from '@/components/RecordForm';
import { Toolbar } from '@/components/Toolbar';
import { SyncStatus } from '@/components/SyncStatus';
import { PasswordGate } from '@/components/PasswordGate';
import { TrashDrawer } from '@/components/TrashDrawer';
import type { LedgerRecord } from '@/types';

const ACCESS_PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD as string | undefined;

function isAuthenticated(): boolean {
  if (!ACCESS_PASSWORD) return true;
  return sessionStorage.getItem('ledger_auth') === 'true';
}

function LedgerApp() {
  useCloudSync();
  useAutoBackup();
  const {
    allRecords,
    selectedIds,
    filters,
    sortField,
    sortDirection,
  } = useLedgerStore(
    useShallow((s) => ({
      allRecords: s.records,
      selectedIds: s.selectedIds,
      filters: s.filters,
      sortField: s.sortField,
      sortDirection: s.sortDirection,
    })),
  );

  const records = useMemo(
    () => filterRecords(allRecords, filters, sortField, sortDirection),
    [allRecords, filters, sortField, sortDirection],
  );

  const selectedSummary = useMemo(() => {
    if (selectedIds.length === 0) {
      return { totalRmb: 0, settledRmb: 0, unsettledRmb: 0, unsettledUsd: 0 };
    }
    const selected = allRecords.filter((r) => selectedIds.includes(r.id));
    return computeSummary(selected);
  }, [allRecords, selectedIds]);

  const filteredSummary = useMemo(() => computeSummary(records), [records]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LedgerRecord | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);

  const handleAdd = () => {
    setEditingRecord(null);
    setFormOpen(true);
  };

  const handleEdit = (record: LedgerRecord) => {
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingRecord(null);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ledger-header text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">戈瓦记账本</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                专业记账 · 实时统计 · 多人云端同步
              </p>
              <div className="mt-1.5">
                <SyncStatus />
              </div>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <Dashboard summary={selectedSummary} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ExchangeRateSetting />
          <BackupStatus />
        </div>

        <Filters />

        <Toolbar onAdd={handleAdd} onOpenTrash={() => setTrashOpen(true)} filteredCount={records.length} />

        <LedgerTable records={records} onEdit={handleEdit} />

        <FooterSummary summary={filteredSummary} />
      </main>

      <RecordForm open={formOpen} onClose={handleCloseForm} record={editingRecord} />
      <TrashDrawer open={trashOpen} onClose={() => setTrashOpen(false)} />
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());

  if (!authed) {
    return <PasswordGate onAuthenticated={() => setAuthed(true)} />;
  }

  return <LedgerApp />;
}
