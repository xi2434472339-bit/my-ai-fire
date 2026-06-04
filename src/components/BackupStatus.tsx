import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Cloud, HardDrive, ShieldCheck } from 'lucide-react';
import { createLedgerBackup, testBackupPermission } from '@/lib/backup';
import type { BackupPermissionStatus } from '@/lib/backup';
import { isConfigured } from '@/lib/sync';
import { useLedgerStore } from '@/store/useLedgerStore';
import { Button } from '@/components/ui/button';

const permissionLabels: Record<BackupPermissionStatus, string> = {
  not_checked: '未检测',
  normal: '正常',
  add_failed: '新增失败',
  delete_failed: '删除失败',
};

function formatBackupTime(value: string | null): string {
  if (!value) return '暂无';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '暂无';
  const pad = (n: number) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    ' ',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
    ':',
    pad(date.getSeconds()),
  ].join('');
}

export function BackupStatus() {
  const cloudEnabled = isConfigured();
  const [permissionStatus, setPermissionStatus] =
    useState<BackupPermissionStatus>('not_checked');
  const [checkingPermission, setCheckingPermission] = useState(false);
  const {
    records,
    removedRecords,
    exchangeRate,
    autoBackupEnabled,
    lastBackupAt,
    backupStatus,
    setAutoBackupEnabled,
    setLastBackupAt,
    setBackupStatus,
  } = useLedgerStore(
    useShallow((state) => ({
      records: state.records,
      removedRecords: state.removedRecords,
      exchangeRate: state.exchangeRate,
      autoBackupEnabled: state.autoBackupEnabled,
      lastBackupAt: state.lastBackupAt,
      backupStatus: state.backupStatus,
      setAutoBackupEnabled: state.setAutoBackupEnabled,
      setLastBackupAt: state.setLastBackupAt,
      setBackupStatus: state.setBackupStatus,
    })),
  );

  const handleManualBackup = async () => {
    setBackupStatus('backing-up');
    try {
      const result = await createLedgerBackup({ records, removedRecords, exchangeRate });
      setLastBackupAt(result.createdAt);
      setBackupStatus('success');
      console.info(
        `[sales-ledger] 手动备份完成：${result.target}，${result.recordCount} 条，${result.createdAt}`,
      );
    } catch (error) {
      setBackupStatus('error');
      console.warn('[sales-ledger] 手动备份失败', error);
    }
  };

  const handlePermissionCheck = async () => {
    if (!cloudEnabled) {
      setPermissionStatus('not_checked');
      return;
    }

    setCheckingPermission(true);
    try {
      const result = await testBackupPermission();
      setPermissionStatus(result);
    } catch {
      setPermissionStatus('add_failed');
    } finally {
      setCheckingPermission(false);
    }
  };

  const buttonLabel =
    backupStatus === 'backing-up'
      ? '备份中...'
      : backupStatus === 'success'
        ? '备份成功'
        : backupStatus === 'error'
          ? '备份失败，请查看控制台'
          : '立即备份';
  const ModeIcon = cloudEnabled ? Cloud : HardDrive;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            checked={autoBackupEnabled}
            onChange={(event) => setAutoBackupEnabled(event.target.checked)}
          />
          启用自动备份
        </label>

        <Button
          variant={backupStatus === 'error' ? 'danger' : 'outline'}
          onClick={handleManualBackup}
          disabled={backupStatus === 'backing-up'}
        >
          {buttonLabel}
        </Button>

        <Button
          variant="ghost"
          onClick={handlePermissionCheck}
          disabled={!cloudEnabled || checkingPermission}
          title={cloudEnabled ? '检测 CloudBase backups 集合权限' : '本地模式无需检测云端权限'}
        >
          <ShieldCheck className="h-4 w-4" />
          {checkingPermission ? '检测中...' : '检测权限'}
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span>上一次备份时间：{formatBackupTime(lastBackupAt)}</span>
        <span className="inline-flex items-center gap-1">
          <ModeIcon className="h-3.5 w-3.5" />
          {cloudEnabled
            ? '云端模式：备份保存到 CloudBase backups 集合'
            : '本地测试模式：备份保存到 localStorage'}
        </span>
        <span>备份权限：{permissionLabels[permissionStatus]}</span>
      </div>
    </section>
  );
}
