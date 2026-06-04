import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { createLedgerBackup } from '@/lib/backup';
import { useLedgerStore } from '@/store/useLedgerStore';

const BACKUP_INTERVAL = 12 * 60 * 60 * 1000;
const DATA_CHANGE_BACKUP_DELAY = 3 * 60 * 1000;

function isBackupDue(lastBackupAt: string | null): boolean {
  if (!lastBackupAt) return true;
  const lastTime = new Date(lastBackupAt).getTime();
  if (!Number.isFinite(lastTime)) return true;
  return Date.now() - lastTime > BACKUP_INTERVAL;
}

function toTime(value: string | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function useAutoBackup() {
  const inFlightRef = useRef(false);
  const {
    records,
    removedRecords,
    exchangeRate,
    autoBackupEnabled,
    lastBackupAt,
    lastDataChangedAt,
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
      lastDataChangedAt: state.lastDataChangedAt,
      syncStatus: state.syncStatus,
      setLastBackupAt: state.setLastBackupAt,
      setBackupStatus: state.setBackupStatus,
    })),
  );
  const latestBackupInputRef = useRef({ records, removedRecords, exchangeRate });

  useEffect(() => {
    latestBackupInputRef.current = { records, removedRecords, exchangeRate };
  }, [exchangeRate, records, removedRecords]);

  const runBackup = useCallback(
    (label: string) => {
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      setBackupStatus('backing-up');
      void createLedgerBackup(latestBackupInputRef.current)
        .then((result) => {
          setLastBackupAt(result.createdAt);
          setBackupStatus('success');
          console.info(
            `[sales-ledger] ${label}完成：${result.target}，${result.recordCount} 条，${result.createdAt}`,
          );
        })
        .catch((error) => {
          setBackupStatus('error');
          console.warn(`[sales-ledger] ${label}失败`, error);
        })
        .finally(() => {
          inFlightRef.current = false;
        });
    },
    [setBackupStatus, setLastBackupAt],
  );

  useEffect(() => {
    if (!autoBackupEnabled) return;
    if (syncStatus === 'connecting') return;
    if (!isBackupDue(lastBackupAt)) return;

    runBackup('自动备份');
  }, [autoBackupEnabled, lastBackupAt, runBackup, syncStatus]);

  useEffect(() => {
    if (!autoBackupEnabled) return;
    if (syncStatus === 'connecting') return;
    if (!lastDataChangedAt) return;
    if (toTime(lastBackupAt) >= toTime(lastDataChangedAt)) return;

    const timer = window.setTimeout(() => {
      runBackup('数据变更延迟备份');
    }, DATA_CHANGE_BACKUP_DELAY);

    return () => window.clearTimeout(timer);
  }, [autoBackupEnabled, lastBackupAt, lastDataChangedAt, runBackup, syncStatus]);
}
