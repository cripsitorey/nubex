"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { processSyncQueue, fetchAndCacheCatalog, getPendingCount } from "@/lib/syncService";
import { CheckCircle, AlertTriangle, WifiOff, RefreshCw, X } from "lucide-react";

const NetworkContext = createContext({
  isOnline: true,
  pendingCount: 0,
  isSyncing: false,
  triggerSync: () => {},
});

export const useNetwork = () => useContext(NetworkContext);

export default function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // ── Toast system ──────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = "info", duration = 5000) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Refresh pending count ─────────────────────────────────────────────────
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // silently ignore
    }
  }, []);

  // ── Sync trigger ──────────────────────────────────────────────────────────
  const triggerSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);

    try {
      const result = await processSyncQueue();

      if (result.processed > 0) {
        addToast(
          `✅ ${result.processed} operación${result.processed > 1 ? "es" : ""} sincronizada${result.processed > 1 ? "s" : ""}`,
          "success",
          6000
        );
      }

      if (result.failed > 0) {
        addToast(
          `⚠️ ${result.failed} operación${result.failed > 1 ? "es" : ""} fallaron. Se reintentarán.`,
          "warning",
          8000
        );
      }

      // Refrescar catálogo local
      await fetchAndCacheCatalog();
    } catch (error) {
      console.error("[NetworkProvider] Sync error:", error);
      addToast("Error durante la sincronización", "error", 5000);
    } finally {
      setIsSyncing(false);
      await refreshPendingCount();
    }
  }, [isSyncing, addToast, refreshPendingCount]);

  // ── Online/Offline listeners ──────────────────────────────────────────────
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      addToast("Conexión restaurada. Sincronizando...", "info", 3000);

      // Breve delay para estabilizar la conexión
      await new Promise(r => setTimeout(r, 1500));
      await triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast("Sin conexión. Modo offline activo.", "warning", 4000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cargar catálogo inicial y contar pendientes
    refreshPendingCount();
    if (navigator.onLine) {
      fetchAndCacheCatalog();
      // Sync automático al arrancar si hay pendientes
      getPendingCount().then(count => {
        if (count > 0) {
          triggerSync();
        }
      });
    }

    // Polling periódico del pending count (cada 30s)
    const interval = setInterval(refreshPendingCount, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toast icon helper ─────────────────────────────────────────────────────
  const getToastStyle = (type) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-success/20 border-success/40",
          icon: <CheckCircle className="w-5 h-5 text-success shrink-0" />,
        };
      case "warning":
        return {
          bg: "bg-warning/20 border-warning/40",
          icon: <AlertTriangle className="w-5 h-5 text-warning shrink-0" />,
        };
      case "error":
        return {
          bg: "bg-error/20 border-error/40",
          icon: <AlertTriangle className="w-5 h-5 text-error shrink-0" />,
        };
      default:
        return {
          bg: "bg-primary/20 border-primary/40",
          icon: <RefreshCw className="w-5 h-5 text-primary shrink-0" />,
        };
    }
  };

  return (
    <NetworkContext.Provider value={{ isOnline, pendingCount, isSyncing, triggerSync }}>
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-warning text-warning-content text-center text-xs py-1.5 font-bold animate-in slide-in-from-top duration-300 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          Modo Offline — Los datos se guardarán localmente
          {pendingCount > 0 && (
            <span className="bg-warning-content text-warning px-2 py-0.5 rounded-full text-[10px] font-bold ml-1">
              {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Syncing indicator */}
      {isSyncing && (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-primary text-primary-content text-center text-xs py-1.5 font-bold animate-in slide-in-from-top duration-300 flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Sincronizando con el servidor...
        </div>
      )}

      {children}

      {/* Toast notifications */}
      <div className="fixed bottom-20 right-4 left-4 sm:left-auto sm:w-96 z-[300] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => {
          const style = getToastStyle(toast.type);
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto ${style.bg} border rounded-2xl p-4 flex items-start gap-3 shadow-2xl backdrop-blur-lg animate-in slide-in-from-bottom-5 fade-in duration-300`}
            >
              {style.icon}
              <p className="text-sm text-white flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-neutral-content/60 hover:text-white transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </NetworkContext.Provider>
  );
}
