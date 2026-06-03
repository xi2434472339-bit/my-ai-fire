import * as XLSX from 'xlsx';
import type { LedgerRecord } from '@/types';
import { formatDateChinese } from './format';

const HEADERS = ['客户', '日期', '类型', '数量', '单价', '金额', 'USTD', '状态', '备注'];

export function exportToExcel(records: LedgerRecord[], filename = '销售台账.xlsx') {
  const rows = records.map((r) => [
    r.client,
    formatDateChinese(r.date),
    r.type,
    r.quantity,
    r.unitPrice,
    r.amount,
    r.usd,
    r.status,
    r.notes,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 24 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '销售台账');
  XLSX.writeFile(wb, filename);
}

function parseNumber(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[¥,\s]/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

function parseDate(val: unknown): string {
  if (!val) return new Date().toISOString().slice(0, 10);
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      const y = date.y;
      const m = String(date.m).padStart(2, '0');
      const d = String(date.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  const str = String(val);
  const cnMatch = str.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (cnMatch) {
    const [, y, m, d] = cnMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function parseStatus(val: unknown): '已结账' | '未结' {
  const s = String(val ?? '').trim();
  if (s === '已结账' || s.includes('已结')) return '已结账';
  return '未结';
}

export function importFromExcel(
  file: File,
  exchangeRate: number,
  generateId: () => string,
  calcAmount: (q: number, p: number) => number,
  calcUsd: (amount: number, rate: number) => number,
): Promise<LedgerRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

        const records: LedgerRecord[] = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i] as unknown[];
          if (!row || row.length === 0) continue;
          const client = String(row[0] ?? '').trim();
          if (!client) continue;

          const quantity = parseNumber(row[3]);
          const unitPrice = parseNumber(row[4]);
          const amount = row[5] != null && row[5] !== '' ? parseNumber(row[5]) : calcAmount(quantity, unitPrice);
          const usd = row[6] != null && row[6] !== '' ? parseNumber(row[6]) : calcUsd(amount, exchangeRate);

          records.push({
            id: generateId(),
            client,
            date: parseDate(row[1]),
            type: String(row[2] ?? '').trim(),
            quantity,
            unitPrice,
            amount,
            usd,
            status: parseStatus(row[7]),
            notes: String(row[8] ?? '').trim(),
          });
        }
        resolve(records);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}
