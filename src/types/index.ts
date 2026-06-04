export type SyncStatus = 'local' | 'connecting' | 'synced' | 'error';

export type BackupRunStatus = 'idle' | 'backing-up' | 'success' | 'error';

export type RecordStatus = '已结账' | '未结';

export interface LedgerRecord {
  id: string;
  client: string;
  date: string;
  type: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  usd: number;
  status: RecordStatus;
  notes: string;
  updatedAt: string;
  deletedAt?: string;
}

export type RemovedRecords = Record<string, string>;

export type SortField = keyof Pick<
  LedgerRecord,
  'client' | 'date' | 'type' | 'quantity' | 'unitPrice' | 'amount' | 'usd' | 'status'
>;

export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  search: string;
  client: string;
  status: '' | RecordStatus;
  dateFrom: string;
  dateTo: string;
}

export interface Summary {
  totalRmb: number;
  settledRmb: number;
  unsettledRmb: number;
  unsettledUsd: number;
}

export interface RecordFormData {
  client: string;
  date: string;
  type: string;
  quantity: number;
  unitPrice: number;
  status: RecordStatus;
  notes: string;
}
