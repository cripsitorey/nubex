"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { getUsers, previewLiquidacion, executeLiquidacion } from "@/services/api";

export default function LiquidationManager() {
  const [vendedores, setVendedores] = useState([]);
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [executing, setExecuting] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const usersData = await getUsers();
      const users = Array.isArray(usersData) ? usersData : usersData.data || [];
      const vends = users.filter(u => u.role === "VENDEDOR");
      setVendedores(vends);

      const previewsMap = {};
      for (const v of vends) {
        try {
          const preview = await previewLiquidacion(v.id);
          if (preview.totalVentas > 0) {
            previewsMap[v.id] = { ...preview, vendedorNombre: v.nombre };
          }
        } catch { /* no pending liquidations */ }
      }
      setPreviews(previewsMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCierre = async (vendedorId) => {
    if (!confirm("¿Ejecutar cierre de caja para este vendedor?")) return;
    setExecuting(vendedorId);
    setError("");
    try {
      await executeLiquidacion(vendedorId);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setExecuting(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  const pendingList = Object.entries(previews);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error/20 text-error p-3 rounded-xl text-sm border border-error/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <Wallet className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-white">Liquidaciones y Cierres (Pendientes)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pendingList.map(([vId, liq]) => {
          const isPositive = liq.netoVendedorDebeAAdmin > 0;
          return (
            <div key={vId} className="glass-card p-6 rounded-3xl border border-white/10 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none ${isPositive ? 'bg-primary/20' : 'bg-success/20'}`} />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-white text-lg">{liq.vendedorNombre}</h3>
                  <p className="text-xs text-neutral-content/60 font-mono">{liq.totalVentas} ventas sin liquidar</p>
                </div>
              </div>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-content/80">Balance Admin:</span>
                  <span className="font-mono text-white">${parseFloat(liq.balanceAdmin).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-content/80">Balance Vendedor:</span>
                  <span className="font-mono text-white">${parseFloat(liq.balanceVendedor).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-neutral-content/80">Neto:</span>
                  <span className="font-mono text-success">${Math.abs(liq.netoVendedorDebeAAdmin).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-white">
                    {isPositive ? 'Vendedor debe transferir:' : 'Admin debe transferir:'}
                  </span>
                  <span className={`text-xl font-bold font-mono ${isPositive ? 'text-primary' : 'text-success'}`}>
                    ${Math.abs(liq.netoVendedorDebeAAdmin).toFixed(2)}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => handleCierre(parseInt(vId))}
                disabled={executing === parseInt(vId)}
                className="w-full btn btn-primary bg-primary text-primary-content font-bold border-0 shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all"
              >
                {executing === parseInt(vId)
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><CheckCircle className="w-5 h-5 mr-2" /> Ejecutar Cierre</>
                }
              </button>
            </div>
          );
        })}

        {pendingList.length === 0 && (
          <div className="md:col-span-2 text-center p-12 text-neutral-content/50 glass-card rounded-3xl">
            No hay liquidaciones pendientes. ¡Todo al día!
          </div>
        )}
      </div>
    </div>
  );
}
