import { getDb, LEDGER_ID, ensureAnonymousLogin, isTcbConfigured } from './tcb';
import type { LedgerRecord } from '@/types';

export interface CloudLedgerData {
  records: LedgerRecord[];
  exchangeRate: number;
  knownClients: string[];
  knownTypes: string[];
  updatedAt?: string;
}

export function isConfigured(): boolean {
  return isTcbConfigured();
}

// Module-level variable shared by pushLedger and useCloudSync.
// Tracks the updatedAt timestamp of the last data WE pushed or pulled.
// When poll sees the same timestamp, it knows nothing changed remotely.
export let lastKnownUpdatedAt: string | null = null;
export function setLastKnownUpdatedAt(ts: string | null) {
  lastKnownUpdatedAt = ts;
}

export async function pushLedger(data: CloudLedgerData): Promise<void> {
  await ensureAnonymousLogin();
  const db = getDb();
  if (!db) return;
  const col = db.collection('ledgers');
  const res = await col.where({ ledgerId: db.command.eq(LEDGER_ID) }).get();
  const pushedAt = new Date().toISOString();
  const payload = {
    ledgerId: LEDGER_ID,
    records: JSON.stringify(data.records),
    exchangeRate: data.exchangeRate,
    knownClients: data.knownClients,
    knownTypes: data.knownTypes,
    updatedAt: pushedAt,
  };
  if (res.data && res.data.length > 0) {
    await col.doc(res.data[0]._id as string).update(payload);
  } else {
    await col.add(payload);
  }
  // Record that WE wrote this timestamp so polling skips it.
  lastKnownUpdatedAt = pushedAt;
}

export async function fetchLedger(): Promise<CloudLedgerData | null> {
  await ensureAnonymousLogin();
  const db = getDb();
  if (!db) return null;
  const res = await db.collection('ledgers').where({ ledgerId: db.command.eq(LEDGER_ID) }).get();
  if (!res.data || res.data.length === 0) return null;
  const raw = res.data[0] as Record<string, unknown>;
  return {
    records: JSON.parse(raw.records as string) as LedgerRecord[],
    exchangeRate: typeof raw.exchangeRate === 'number' ? raw.exchangeRate : 7,
    knownClients: Array.isArray(raw.knownClients) ? raw.knownClients as string[] : [],
    knownTypes: Array.isArray(raw.knownTypes) ? raw.knownTypes as string[] : [],
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
  };
}

export function getSyncableState(state: {
  records: LedgerRecord[];
  exchangeRate: number;
  knownClients: string[];
  knownTypes: string[];
}): CloudLedgerData {
  return {
    records: state.records,
    exchangeRate: state.exchangeRate,
    knownClients: state.knownClients,
    knownTypes: state.knownTypes,
  };
}
