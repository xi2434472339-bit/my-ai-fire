import { format, parseISO, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDateChinese(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return dateStr;
    return format(date, 'yyyy年M月d日', { locale: zhCN });
  } catch {
    return dateStr;
  }
}

export function formatRmb(value: number): string {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatUsd(value: number): string {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
}

export function calcAmount(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function calcUsd(amount: number, exchangeRate: number): number {
  if (exchangeRate <= 0) return 0;
  return Math.round((amount / exchangeRate) * 100) / 100;
}

export function toISODate(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}
