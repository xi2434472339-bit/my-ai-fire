import { ensureAnonymousLogin, getDb, LEDGER_ID } from '@/lib/tcb';
import { isConfigured } from '@/lib/sync';
import type { BackupTimezone, LedgerRecord, RemovedRecords } from '@/types';

const LOCAL_BACKUPS_KEY = 'sales-ledger-backups';
const MAX_BACKUPS = 30;
const BACKUP_TIMEZONE: BackupTimezone = 'Asia/Shanghai';

export type BackupPermissionStatus =
  | 'not_checked'
  | 'normal'
  | 'add_failed'
  | 'delete_failed';

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
  createdAtLocal: string;
  timezone: BackupTimezone;
  recordCount: number;
}

function formatShanghaiTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: BACKUP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
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
  const now = new Date();
  return {
    ledgerId: LEDGER_ID,
    records: input.records,
    removedRecords: input.removedRecords,
    exchangeRate: input.exchangeRate,
    createdAt: now.toISOString(),
    createdAtLocal: formatShanghaiTime(now),
    timezone: BACKUP_TIMEZONE,
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

export async function testBackupPermission(): Promise<BackupPermissionStatus> {
  if (!isConfigured()) return 'not_checked';

  const createdAt = new Date().toISOString();
  let testDocId = '';
  let db: NonNullable<ReturnType<typeof getDb>>;

  try {
    await ensureAnonymousLogin();
    const activeDb = getDb();
    if (!activeDb) return 'add_failed';
    db = activeDb;
  } catch {
    return 'add_failed';
  }

  const col = db.collection('backups');

  try {
    const addResult = (await col.add({
      ledgerId: LEDGER_ID,
      isPermissionTest: true,
      createdAt,
    })) as { id?: string; _id?: string };
    testDocId = String(addResult.id ?? addResult._id ?? '');
  } catch {
    return 'add_failed';
  }

  try {
    if (!testDocId) {
      const res = await col
        .where({
          ledgerId: db.command.eq(LEDGER_ID),
          isPermissionTest: db.command.eq(true),
          createdAt: db.command.eq(createdAt),
        })
        .get();
      const match = (res.data ?? [])[0] as Record<string, unknown> | undefined;
      testDocId = typeof match?._id === 'string' ? match._id : '';
    }

    if (!testDocId) return 'delete_failed';

    await col.doc(testDocId).remove();
    return 'normal';
  } catch {
    return 'delete_failed';
  }
}
