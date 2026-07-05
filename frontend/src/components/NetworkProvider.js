'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { flushVentasQueue, getPendingCount } from '@/lib/syncService';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(() => {
    getPendingCount().then(setPendingCount).catch(() => {});
  }, []);

  const sync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await flushVentasQueue();
    } finally {
      setSyncing(false);
      refreshPending();
    }
  }, [syncing, refreshPending]);

  useEffect(() => {
    setOnline(navigator.onLine);
    refreshPending();

    const handleOnline = () => { setOnline(true); sync(); };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NetworkContext.Provider value={{ online, pendingCount, syncing, refreshPending, sync }}>
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => useContext(NetworkContext);
