import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FilterState,
  LedgerRecord,
  RecordFormData,
  RecordStatus,
  RemovedRecords,
  SortDirection,
  SortField,
  Summary,
  SyncStatus,
} from '@/types';
import { SEED_RECORDS } from '@/data/seed';
import { calcAmount, calcUsd } from '@/lib/format';
import { getSyncableState, pushLedger, isConfigured, fetchLedger } from '@/lib/sync';
import { generateId } from '@/lib/utils';
import type { CloudLedgerData } from '@/lib/sync';

interface LedgerState {
  records: LedgerRecord[];
  exchangeRate: number;
  darkMode: boolean;
  filters: FilterState;
  sortField: SortField;
  sortDirection: SortDirection;
  selectedIds: string[];
  removedRecords: RemovedRecords;
  knownClients: string[];
  knownTypes: string[];
  syncStatus: SyncStatus;
  isHydratingFromCloud: boolean;

  setSyncStatus: (status: SyncStatus) => void;
  hydrateFromCloud: (data: CloudLedgerData) => void;
  syncToCloud: () => Promise<void>;

  setExchangeRate: (rate: number) => void;
  toggleDarkMode: () => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setSort: (field: SortField) => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  addRecord: (data: RecordFormData) => void;
  updateRecord: (id: string, data: RecordFormData) => void;
  deleteRecord: (id: string) => void;
  deleteSelected: () => void;
  settleSelected: () => void;
  settleRecord: (id: string) => void;
  importRecords: (records: LedgerRecord[]) => void;
  resetToSeed: () => void;

  getDeletedRecords: () => LedgerRecord[];
  restoreRecord: (id: string) => void;
  permanentlyDeleteRecord: (id: string) => void;
  purgeExpiredTrash: () => void;

  getFilteredRecords: () => LedgerRecord[];
  getSummary: () => Summary;
}

const defaultFilters: FilterState = {
  search: '',
  client: '',
  status: '',
  dateFrom: '',
  dateTo: '',
};

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const LEGACY_UPDATED_AT = '1970-01-01T00:00:00.000Z';

function normalizeStatus(status: unknown): RecordStatus {
  const s = String(status ?? '').trim();
  return s === '已结账' || s.includes('已结') ? '已结账' : '未结';
}

function toTime(value: string | undefined): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function normalizeUpdatedAt(record: Partial<LedgerRecord>): string {
  if (toTime(record.updatedAt)) return String(record.updatedAt);
  if (toTime(record.deletedAt)) return String(record.deletedAt);
  if (toTime(record.date)) return new Date(String(record.date)).toISOString();
  return LEGACY_UPDATED_AT;
}

function mergeRemovedRecords(
  localRemovedRecords: RemovedRecords,
  cloudRemovedRecords: RemovedRecords,
): RemovedRecords {
  const merged: RemovedRecords = { ...localRemovedRecords };
  for (const [id, removedAt] of Object.entries(cloudRemovedRecords)) {
    if (toTime(removedAt) > toTime(merged[id])) {
      merged[id] = removedAt;
    }
  }
  return merged;
}

function sanitizeRecord(raw: unknown): LedgerRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<LedgerRecord>;
  if (!r.id || !r.client) return null;

  const quantity = Number(r.quantity) || 0;
  const unitPrice = Number(r.unitPrice) || 0;
  const amount = Number(r.amount) || calcAmount(quantity, unitPrice);

  return {
    id: String(r.id),
    client: String(r.client),
    date: String(r.date || new Date().toISOString().slice(0, 10)),
    type: String(r.type ?? ''),
    quantity,
    unitPrice,
    amount,
    usd: Number(r.usd) || 0,
    status: normalizeStatus(r.status),
    notes: String(r.notes ?? ''),
    updatedAt: normalizeUpdatedAt(r),
    deletedAt: r.deletedAt ? String(r.deletedAt) : undefined,
  };
}

function sanitizeRecords(records: unknown): LedgerRecord[] {
  if (!Array.isArray(records)) return createSeedRecords();
  return records
    .map(sanitizeRecord)
    .filter((r): r is LedgerRecord => r !== null);
}

function buildRecord(data: RecordFormData, exchangeRate: number, id?: string): LedgerRecord {
  const now = new Date().toISOString();
  const amount = calcAmount(data.quantity, data.unitPrice);
  return {
    id: id ?? generateId(),
    ...data,
    amount,
    usd: calcUsd(amount, exchangeRate),
    updatedAt: now,
  };
}

function recalcRecord(record: LedgerRecord, exchangeRate: number): LedgerRecord {
  const amount = calcAmount(record.quantity, record.unitPrice);
  return { ...record, amount, usd: calcUsd(amount, exchangeRate) };
}

function createSeedRecords(): LedgerRecord[] {
  const now = new Date().toISOString();
  return SEED_RECORDS.map((r) => ({ ...r, id: generateId(), updatedAt: r.updatedAt ?? now }));
}

function mergeRecordsForSync(
  localRecords: LedgerRecord[],
  cloudRecords: LedgerRecord[],
  localRemovedRecords: RemovedRecords,
  cloudRemovedRecords: RemovedRecords,
): { records: LedgerRecord[]; removedRecords: RemovedRecords } {
  const localById = new Map(localRecords.map((r) => [r.id, r]));
  const cloudById = new Map(cloudRecords.map((r) => [r.id, r]));
  const removedRecords = mergeRemovedRecords(localRemovedRecords, cloudRemovedRecords);
  const ids = new Set([
    ...localById.keys(),
    ...cloudById.keys(),
    ...Object.keys(removedRecords),
  ]);
  const now = Date.now();
  const result: LedgerRecord[] = [];

  for (const id of ids) {
    const local = localById.get(id);
    const cloud = cloudById.get(id);
    const newest =
      !cloud || (local && toTime(local.updatedAt) >= toTime(cloud.updatedAt))
        ? local
        : cloud;

    if (!newest) continue;

    const removedAt = toTime(removedRecords[id]);
    if (removedAt > toTime(newest.updatedAt)) continue;

    if (newest.deletedAt) {
      const age = now - toTime(newest.deletedAt);
      if (age >= THIRTY_DAYS) {
        removedRecords[id] = new Date(Math.max(now, removedAt)).toISOString();
        continue;
      }
    }

    result.push(newest);
  }

  return { records: result, removedRecords };
}

function pruneRecordsWithRemovedTombstones(
  records: LedgerRecord[],
  removedRecords: RemovedRecords,
): LedgerRecord[] {
  return records.filter((record) => {
    const removedAt = toTime(removedRecords[record.id]);
    return !removedAt || removedAt <= toTime(record.updatedAt);
  });
}

async function maybePushToCloud(get: () => LedgerState) {
  if (!isConfigured()) return;
  const state = get();
  if (state.isHydratingFromCloud) return;
  try {
    const cloudData = await fetchLedger();
    let recordsToPush = getSyncableState(state);
    if (cloudData) {
      const merged = mergeRecordsForSync(
        state.records,
        sanitizeRecords(cloudData.records),
        state.removedRecords,
        cloudData.removedRecords,
      );
      recordsToPush = {
        ...recordsToPush,
        records: merged.records,
        removedRecords: merged.removedRecords,
      };
      useLedgerStore.setState({
        records: merged.records,
        removedRecords: merged.removedRecords,
      });
    }
    await pushLedger(recordsToPush);
    useLedgerStore.getState().setSyncStatus('synced');
  } catch {
    useLedgerStore.getState().setSyncStatus('error');
  }
}

export function filterRecords(
  records: LedgerRecord[],
  filters: FilterState,
  sortField: SortField,
  sortDirection: SortDirection,
): LedgerRecord[] {
  let result = records.filter((r) => !r.deletedAt);

  const searchQuery = (filters.search ?? '').trim();
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (r) =>
        (r.client ?? '').toLowerCase().includes(q) ||
        (r.type ?? '').toLowerCase().includes(q) ||
        (r.notes ?? '').toLowerCase().includes(q) ||
        (r.status ?? '').includes(searchQuery),
    );
  }

  const clientQuery = (filters.client ?? '').trim();
  if (clientQuery) {
    result = result.filter((r) =>
      (r.client ?? '').toLowerCase().includes(clientQuery.toLowerCase()),
    );
  }

  if (filters.status) {
    result = result.filter((r) => r.status === filters.status);
  }

  if (filters.dateFrom) {
    result = result.filter((r) => r.date >= filters.dateFrom);
  }

  if (filters.dateTo) {
    result = result.filter((r) => r.date <= filters.dateTo);
  }

  result.sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    let cmp = 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      cmp = aVal - bVal;
    } else {
      cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''), 'zh-CN');
    }
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  return result;
}

export function computeSummary(records: LedgerRecord[]): Summary {
  let totalRmb = 0;
  let settledRmb = 0;
  let unsettledRmb = 0;
  let unsettledUsd = 0;

  for (const r of records.filter((r) => !r.deletedAt)) {
    totalRmb += r.amount;
    if (r.status === '已结账') {
      settledRmb += r.amount;
    } else {
      unsettledRmb += r.amount;
      unsettledUsd += r.usd;
    }
  }

  return {
    totalRmb: Math.round(totalRmb * 100) / 100,
    settledRmb: Math.round(settledRmb * 100) / 100,
    unsettledRmb: Math.round(unsettledRmb * 100) / 100,
    unsettledUsd: Math.round(unsettledUsd * 100) / 100,
  };
}

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set, get) => ({
      records: createSeedRecords(),
      exchangeRate: 7,
      darkMode: false,
      filters: { ...defaultFilters },
      sortField: 'date',
      sortDirection: 'desc',
      selectedIds: [],
      removedRecords: {},
      knownClients: ['鏄ョ敓', '瀹囬', '闃挎澃', '杩堝反璧彁绡瓙'],
      knownTypes: ['群码作品粉', '精准作品粉', '视频号冲颉粉'],
      syncStatus: isConfigured() ? 'connecting' : 'local',
      isHydratingFromCloud: false,

      setSyncStatus: (status) => set({ syncStatus: status }),

      hydrateFromCloud: (data) => {
        const removedRecords = data.removedRecords ?? {};
        const records = pruneRecordsWithRemovedTombstones(
          sanitizeRecords(data.records),
          removedRecords,
        );
        set({
          isHydratingFromCloud: true,
          records,
          removedRecords,
          exchangeRate:
            typeof data.exchangeRate === 'number' && data.exchangeRate > 0
              ? data.exchangeRate
              : 7,
          knownClients: Array.isArray(data.knownClients) ? data.knownClients : [],
          knownTypes: Array.isArray(data.knownTypes) ? data.knownTypes : [],
        });
        // Defer clearing the flag so any synchronous maybePushToCloud calls
        // triggered by the same event loop tick see isHydratingFromCloud=true
        // and skip the redundant cloud push.
        setTimeout(() => set({ isHydratingFromCloud: false }), 0);
      },

      syncToCloud: async () => {
        await maybePushToCloud(get);
      },

      setExchangeRate: (rate) => {
        set((state) => ({
          exchangeRate: rate,
          records: state.records.map((r) => recalcRecord(r, rate)),
        }));
        void maybePushToCloud(get);
      },

      toggleDarkMode: () => {
        set((state) => {
          const darkMode = !state.darkMode;
          document.documentElement.classList.toggle('dark', darkMode);
          return { darkMode };
        });
      },

      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),

      resetFilters: () => set({ filters: { ...defaultFilters } }),

      setSort: (field) =>
        set((state) => ({
          sortField: field,
          sortDirection:
            state.sortField === field && state.sortDirection === 'asc' ? 'desc' : 'asc',
        })),

      toggleSelect: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id],
        })),

      selectAll: (ids) => set({ selectedIds: [...ids] }),

      clearSelection: () => set({ selectedIds: [] }),

      addRecord: (data) => {
        set((state) => {
          const record = buildRecord(data, state.exchangeRate);
          const knownClients = state.knownClients.includes(data.client)
            ? state.knownClients
            : [...state.knownClients, data.client];
          const knownTypes = state.knownTypes.includes(data.type)
            ? state.knownTypes
            : [...state.knownTypes, data.type];
          return {
            records: [...state.records, record],
            knownClients,
            knownTypes,
          };
        });
        void maybePushToCloud(get);
      },

      updateRecord: (id, data) => {
        set((state) => {
          const knownClients = state.knownClients.includes(data.client)
            ? state.knownClients
            : [...state.knownClients, data.client];
          const knownTypes = state.knownTypes.includes(data.type)
            ? state.knownTypes
            : [...state.knownTypes, data.type];
          return {
            records: state.records.map((r) =>
              r.id === id ? buildRecord(data, state.exchangeRate, id) : r,
            ),
            knownClients,
            knownTypes,
          };
        });
        void maybePushToCloud(get);
      },

      deleteRecord: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, deletedAt: now, updatedAt: now } : r,
          ),
          selectedIds: state.selectedIds.filter((sid) => sid !== id),
        }));
        void maybePushToCloud(get);
      },

      deleteSelected: () => {
        set((state) => {
          const ids = new Set(state.selectedIds);
          const now = new Date().toISOString();
          return {
            records: state.records.map((r) =>
              ids.has(r.id) ? { ...r, deletedAt: now, updatedAt: now } : r,
            ),
            selectedIds: [],
          };
        });
        void maybePushToCloud(get);
      },

      settleSelected: () => {
        set((state) => {
          const ids = new Set(state.selectedIds);
          const now = new Date().toISOString();
          return {
            records: state.records.map((r) =>
              ids.has(r.id) && r.status === '未结'
                ? { ...r, status: '已结账' as RecordStatus, updatedAt: now }
                : r,
            ),
            selectedIds: [],
          };
        });
        void maybePushToCloud(get);
      },

      settleRecord: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id
              ? { ...r, status: '已结账' as RecordStatus, updatedAt: now }
              : r,
          ),
          selectedIds: state.selectedIds.filter((sid) => sid !== id),
        }));
        void maybePushToCloud(get);
      },

      importRecords: (imported) => {
        set((state) => {
          const clients = new Set(state.knownClients);
          const types = new Set(state.knownTypes);
          const now = new Date().toISOString();
          const records = imported.map((r) => ({ ...r, updatedAt: now }));
          records.forEach((r) => {
            clients.add(r.client);
            if (r.type) types.add(r.type);
          });
          return {
            records: [...state.records, ...records],
            knownClients: [...clients],
            knownTypes: [...types],
          };
        });
        void maybePushToCloud(get);
      },

      resetToSeed: () => {
        set({
          records: createSeedRecords(),
          selectedIds: [],
          removedRecords: {},
        });
        void maybePushToCloud(get);
      },

      getDeletedRecords: () => {
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        return get().records.filter(
          (r) => r.deletedAt && now - new Date(r.deletedAt).getTime() < THIRTY_DAYS,
        );
      },

      restoreRecord: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, deletedAt: undefined, updatedAt: now } : r,
          ),
        }));
        void maybePushToCloud(get);
      },

      permanentlyDeleteRecord: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
          removedRecords: { ...state.removedRecords, [id]: now },
        }));
        void maybePushToCloud(get);
      },

      purgeExpiredTrash: () => {
        const now = Date.now();
        const removedAt = new Date().toISOString();
        set((state) => {
          const removedRecords = { ...state.removedRecords };
          const records = state.records.filter((r) => {
            const expired = Boolean(r.deletedAt && now - toTime(r.deletedAt) >= THIRTY_DAYS);
            if (expired) removedRecords[r.id] = removedAt;
            return !expired;
          });
          return { records, removedRecords };
        });
        void maybePushToCloud(get);
      },

      getFilteredRecords: () => {
        const { records, filters, sortField, sortDirection } = get();
        return filterRecords(records, filters, sortField, sortDirection);
      },

      getSummary: () => computeSummary(get().records),
    }),
    {
      name: 'sales-ledger-storage',
      version: 1,
      partialize: (state) => ({
        records: state.records,
        removedRecords: state.removedRecords,
        exchangeRate: state.exchangeRate,
        darkMode: state.darkMode,
        knownClients: state.knownClients,
        knownTypes: state.knownTypes,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
        }
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<LedgerState> | undefined;
        return {
          ...current,
          records: sanitizeRecords(p?.records),
          removedRecords:
            p?.removedRecords && typeof p.removedRecords === 'object'
              ? p.removedRecords
              : current.removedRecords,
          exchangeRate:
            typeof p?.exchangeRate === 'number' && p.exchangeRate > 0
              ? p.exchangeRate
              : current.exchangeRate,
          darkMode: Boolean(p?.darkMode),
          knownClients: Array.isArray(p?.knownClients) ? p.knownClients : current.knownClients,
          knownTypes: Array.isArray(p?.knownTypes) ? p.knownTypes : current.knownTypes,
          selectedIds: [],
          filters: { ...defaultFilters },
        };
      },
    },
  ),
);
