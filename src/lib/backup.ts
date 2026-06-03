import { ensureAnonymousLogin, getDb, LEDGER_ID } from '@/lib/tcb';
import { isConfigured } from '@/lib/sync';
import type { LedgerRecord, RemovedRecords } from '@/types';

const LOCAL_BACKUPS_KEY = 'sales-ledger-backups';
const MAX_BACKUPS = 30;

export interface BackupInput {
  records: LedgerRecord[];
  removedRecords: RemovedRecords;
  exchangeRate: number;
}

export interface BackupResult {
  createdAt: string;
  recordCount: number;
  target: 'cloud' | 'local';
}

interface BackupPayload extends BackupInput {
  ledgerId: string;
  createdAt: string;
  recordCount: number;
}

function readLocalBackups(): BackupPayload[] {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as BackupPayload[] : [];
  } catch {
    return [];
  }
}

function createPayload(input: BackupInput): BackupPayload {
  return {
    ledgerId: LEDGER_ID,
    records: input.records,
    removedRecords: input.removedRecords,
    exchangeRate: input.exchangeRate,
    createdAt: new Date().toISOString(),
    recordCount: input.records.length,
  };
}

async function createLocalBackup(input: BackupInput): Promise<BackupResult> {
  const payload = createPayload(input);
  const backups = [payload, ...readLocalBackups()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_BACKUPS);
  localStorage.setItem(LOCAL_BACKUPS_KEY, JSON.stringify(backups));
  return {
    createdAt: payload.createdAt,
    recordCount: payload.recordCount,
    target: 'local',
  };
}

async function createCloudBackup(input: BackupInput): Promise<BackupResult> {
  await ensureAnonymousLogin();
  const db = getDb();
  if (!db) return createLocalBackup(input);

  const col = db.collection('backups');
  const payload = createPayload(input);
  await col.add({
    ...payload,
    records: JSON.stringify(payload.records),
  });

  const res = await col.where({ ledgerId: db.command.eq(LEDGER_ID) }).get();
  const backups = (res.data ?? [])
    .map((item: Record<string, unknown>) => ({
      id: String(item._id ?? ''),
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
    }))
    .filter((item) => item.id && item.createdAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const expired = backups.slice(MAX_BACKUPS);
  await Promise.all(expired.map((item) => col.doc(item.id).remove()));

  return {
    createdAt: payload.createdAt,
    recordCount: payload.recordCount,
    target: 'cloud',
  };
}

export async function createLedgerBackup(input: BackupInput): Promise<BackupResult> {
  if (!isConfigured()) {
    return createLocalBackup(input);
  }
  return createCloudBackup(input);
}
