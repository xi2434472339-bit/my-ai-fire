import { useEffect } from 'react';
import { isConfigured, fetchLedger, pushLedger, getSyncableState, lastKnownUpdatedAt, setLastKnownUpdatedAt } from '@/lib/sync';
import { useLedgerStore } from '@/store/useLedgerStore';

const POLL_INTERVAL = 5000;

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
        }

        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    }

    syncOnce();
    const timer = setInterval(syncOnce, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [cloudEnabled, hydrateFromCloud, setSyncStatus]);

  return { cloudEnabled };
}
