import { useEffect } from 'react';
import { isConfigured, fetchLedger, pushLedger, getSyncableState, lastKnownUpdatedAt, setLastKnownUpdatedAt } from '@/lib/sync';
import { hasLegacyClientNames } from '@/lib/clientNames';
import { useLedgerStore } from '@/store/useLedgerStore';

const POLL_INTERVAL = 5000;

function cloudDataNeedsClientRepair(data: Awaited<ReturnType<typeof fetchLedger>>): boolean {
  return Boolean(
    data
    && (
      hasLegacyClientNames(data.knownClients)
      || data.records.some((record) => hasLegacyClientNames([record.client]))
    )
  );
}

export function useCloudSync() {
  const hydrateFromCloud = useLedgerStore((s) => s.hydrateFromCloud);
  const setSyncStatus = useLedgerStore((s) => s.setSyncStatus);
  const cloudEnabled = isConfigured();

  useEffect(() => {
    if (!cloudEnabled) {
      setSyncStatus('local');
      return;
    }

    setSyncStatus('connecting');
    let initialized = false;

    async function syncOnce() {
      try {
        const data = await fetchLedger();

        if (!initialized) {
          // First load
          if (data) {
            // Cloud has data: pull it in and remember its timestamp
            setLastKnownUpdatedAt(data.updatedAt ?? null);
            hydrateFromCloud(data);
            if (cloudDataNeedsClientRepair(data)) {
              await pushLedger(getSyncableState(useLedgerStore.getState()));
            }
          } else {
            // Cloud is empty: push local state to initialise
            const state = useLedgerStore.getState();
            await pushLedger(getSyncableState(state));
            // pushLedger already updates lastKnownUpdatedAt internally
          }
          initialized = true;
          setSyncStatus('synced');
          return;
        }

        // Subsequent polls: only pull when cloud timestamp changed
        // (meaning another client pushed new data)
        if (data?.updatedAt && data.updatedAt !== lastKnownUpdatedAt) {
          setLastKnownUpdatedAt(data.updatedAt);
          hydrateFromCloud(data);
          if (cloudDataNeedsClientRepair(data)) {
            await pushLedger(getSyncableState(useLedgerStore.getState()));
          }
        }

        setSyncStatus('synced');
      } catch (error) {
        console.error("[sales-ledger] Cloud sync polling failed", error);
        setSyncStatus('error');
      }
    }

    syncOnce();
    const timer = setInterval(syncOnce, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [cloudEnabled, hydrateFromCloud, setSyncStatus]);

  return { cloudEnabled };
}
