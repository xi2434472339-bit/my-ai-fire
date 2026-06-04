import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { createLedgerBackup } from '@/lib/backup';
import { useLedgerStore } from '@/store/useLedgerStore';

const BACKUP_INTERVAL = 12 * 60 * 60 * 1000;

function isBackupDue(lastBackupAt: string | null): boolean {
  if (!lastBackupAt) return true;
  const lastTime = new Date(lastBackupAt).getTime();
  if (!Number.isFinite(lastTime)) return true;
  return Date.now() - lastTime > BACKUP_INTERVAL;
}

export function useAutoBackup() {
  const inFlightRef = useRef(false);
  const {
    records,
    removedRecords,
    exchangeRate,
    autoBackupEnabled,
    lastBackupAt,
    syncStatus,
    setLastBackupAt,
    setBackupStatus,
  } = useLedgerStore(
    useShallow((state) => ({
      records: state.records,
      removedRecords: state.removedRecords,
      exchangeRate: state.exchangeRate,
      autoBackupEnabled: state.autoBackupEnabled,
      lastBackupAt: state.lastBackupAt,
      syncStatus: state.syncStatus,
      setLastBackupAt: state.setLastBackupAt,
      setBackupStatus: state.setBackupStatus,
    })),
  );

  useEffect(() => {
    if (!autoBackupEnabled) return;
    if (syncStatus === 'connecting') return;
    if (!isBackupDue(lastBackupAt)) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setBackupStatus('backing-up');
    void createLedgerBackup({ records, removedRecords, exchangeRate })
      .then((result) => {
        setLastBackupAt(result.createdAt);
        setBackupStatus('success');
        console.info(
          `[sales-ledger] 自动备份完成：${result.target}，${result.recordCount} 条，${result.createdAt}`,
        );
      })
      .catch((error) => {
        setBackupStatus('error');
        console.warn('[sales-ledger] 自动备份失败', error);
      })
      .finally(() => {
        inFlightRef.current = false;
      });
  }, [
    autoBackupEnabled,
    exchangeRate,
    lastBackupAt,
    records,
    removedRecords,
    setBackupStatus,
    setLastBackupAt,
    syncStatus,
  ]);
}
