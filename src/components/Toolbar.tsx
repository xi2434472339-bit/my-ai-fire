import { useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  Moon,
  Sun,
  Trash,
} from 'lucide-react';
import { useLedgerStore } from '@/store/useLedgerStore';
import { exportToExcel, importFromExcel } from '@/lib/excel';
import { generateId } from '@/lib/utils';
import { calcAmount, calcUsd } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface ToolbarProps {
  onAdd: () => void;
  onOpenTrash: () => void;
  filteredCount: number;
}

export function Toolbar({ onAdd, onOpenTrash, filteredCount }: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const records = useLedgerStore((s) => s.records);
  const exchangeRate = useLedgerStore((s) => s.exchangeRate);
  const selectedIds = useLedgerStore((s) => s.selectedIds);
  const darkMode = useLedgerStore((s) => s.darkMode);
  const deleteSelected = useLedgerStore((s) => s.deleteSelected);
  const settleSelected = useLedgerStore((s) => s.settleSelected);
  const importRecords = useLedgerStore((s) => s.importRecords);
  const toggleDarkMode = useLedgerStore((s) => s.toggleDarkMode);
  const getDeletedRecords = useLedgerStore((s) => s.getDeletedRecords);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSettle, setConfirmSettle] = useState(false);

  const selectedCount = selectedIds.length;
  const trashCount = getDeletedRecords().length;

  const handleExport = () => {
    exportToExcel(records.filter((r) => !r.deletedAt));
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromExcel(
        file,
        exchangeRate,
        generateId,
        calcAmount,
        calcUsd,
      );
      if (imported.length > 0) {
        importRecords(imported);
        alert(`成功导入 ${imported.length} 条记录`);
      } else {
        alert('未找到有效数据');
      }
    } catch {
      alert('导入失败，请检查文件格式');
    }
    e.target.value = '';
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" />
          新增记录
        </Button>

        {selectedCount > 0 && (
          <>
            <Button variant="success" onClick={() => setConfirmSettle(true)}>
              <CheckCircle className="h-4 w-4" />
              批量结账 ({selectedCount})
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" />
              批量删除 ({selectedCount})
            </Button>
          </>
        )}

        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4" />
          导出 Excel
        </Button>

        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" />
          导入 Excel
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleImport}
        />

        <Button variant="ghost" size="icon" onClick={toggleDarkMode} title="切换主题">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="outline" onClick={onOpenTrash} title="回收站" className="relative">
          <Trash className="h-4 w-4" />
          回收站
          {trashCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {trashCount}
            </span>
          )}
        </Button>

        <span className="ml-auto text-sm text-slate-500 dark:text-slate-400">
          显示 {filteredCount} / {records.filter((r) => !r.deletedAt).length} 条
        </span>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => { deleteSelected(); }}
        title="批量删除"
        description={`确定要删除已选的 ${selectedCount} 条记录吗？删除后可在回收站找回，30 天内有效。`}
        confirmLabel="移入回收站"
        variant="danger"
      />

      <ConfirmDialog
        open={confirmSettle}
        onClose={() => setConfirmSettle(false)}
        onConfirm={() => { settleSelected(); }}
        title="批量结账"
        description={`确定要将已选的 ${selectedCount} 条未结记录全部标记为已结账吗？结账后状态无法撤销。`}
        confirmLabel="确认结账"
        variant="warning"
      />
    </>
  );
}
