import { useState, useEffect } from 'react';
import { useLedgerStore } from '@/store/useLedgerStore';
import { calcAmount, calcUsd, toISODate } from '@/lib/format';
import { normalizeClientName, normalizeKnownClients } from '@/lib/clientNames';
import type { LedgerRecord, RecordFormData } from '@/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { formatRmb } from '@/lib/format';

interface RecordFormProps {
  open: boolean;
  onClose: () => void;
  record?: LedgerRecord | null;
}

const emptyForm = (): RecordFormData => ({
  client: '',
  date: toISODate(),
  type: '',
  quantity: 0,
  unitPrice: 0,
  status: '未结',
  notes: '',
});

export function RecordForm({ open, onClose, record }: RecordFormProps) {
  const knownClients = useLedgerStore((s) => s.knownClients);
  const knownTypes = useLedgerStore((s) => s.knownTypes);
  const exchangeRate = useLedgerStore((s) => s.exchangeRate);
  const addRecord = useLedgerStore((s) => s.addRecord);
  const updateRecord = useLedgerStore((s) => s.updateRecord);

  const [form, setForm] = useState<RecordFormData>(emptyForm);
  const [clientInput, setClientInput] = useState('');
  const [typeInput, setTypeInput] = useState('');

  useEffect(() => {
    if (record) {
      setForm({
        client: normalizeClientName(record.client),
        date: record.date,
        type: record.type,
        quantity: record.quantity,
        unitPrice: record.unitPrice,
        status: record.status,
        notes: record.notes,
      });
      setClientInput(normalizeClientName(record.client));
      setTypeInput(record.type);
    } else {
      setForm(emptyForm());
      setClientInput('');
      setTypeInput('');
    }
  }, [record, open]);

  const amount = calcAmount(form.quantity, form.unitPrice);
  const usd = calcUsd(amount, exchangeRate);
  const clientOptions = normalizeKnownClients(knownClients);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: RecordFormData = {
      ...form,
      client: normalizeClientName(clientInput || form.client),
      type: typeInput.trim() || form.type,
    };
    if (!data.client) return;

    if (record) {
      updateRecord(record.id, data);
    } else {
      addRecord(data);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={record ? '编辑记录' : '新增记录'}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="client">客户 *</Label>
          <Input
            id="client"
            list="client-list"
            value={clientInput}
            onChange={(e) => setClientInput(e.target.value)}
            placeholder="输入或选择客户"
            required
          />
          <datalist id="client-list">
            {clientOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="date">日期</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">状态</Label>
            <Select
              id="status"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as '已结账' | '未结' })
              }
            >
              <option value="未结">未结</option>
              <option value="已结账">已结账</option>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="type">类型</Label>
          <Input
            id="type"
            list="type-list"
            value={typeInput}
            onChange={(e) => setTypeInput(e.target.value)}
            placeholder="输入或选择类型"
          />
          <datalist id="type-list">
            {knownTypes.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="quantity">数量</Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              step={1}
              value={form.quantity || ''}
              onChange={(e) =>
                setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unitPrice">单价</Label>
            <Input
              id="unitPrice"
              type="number"
              min={0}
              step={0.01}
              value={form.unitPrice || ''}
              onChange={(e) =>
                setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        <div className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800">
          <div className="flex justify-between">
            <span>金额 (RMB)</span>
            <span className="font-bold text-red-600">{formatRmb(amount)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span>USTD</span>
            <span className="font-medium">{usd.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">备注</Label>
          <Input
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="订单备注"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="submit">{record ? '保存' : '添加'}</Button>
        </div>
      </form>
    </Dialog>
  );
}
