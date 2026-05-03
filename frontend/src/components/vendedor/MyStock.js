"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Loader2, AlertCircle } from "lucide-react";
import { getInventory } from "@/services/api";

export default function MyStock() {
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getInventory();
      // data for vendedor is an array of InventarioVendedor objects
      const items = Array.isArray(data) ? data : data.data || [];
      setInventario(items.filter(i => i.vape));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error/20 text-error p-3 rounded-xl text-sm border border-error/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> Mi Inventario
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventario.map(item => (
          <div key={item.id} className="glass-card rounded-3xl p-5 border border-white/10 relative overflow-hidden group">
            {/* Background glow effect based on stock */}
            <div className={`absolute -inset-10 opacity-20 blur-2xl rounded-full ${item.cantidad === 0 ? 'bg-error' : item.cantidad < 5 ? 'bg-warning' : 'bg-primary'}`} />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-white leading-tight">{item.vape.nombre}</h3>
                  {item.vape.sabor && <p className="text-xs text-primary/80">{item.vape.sabor}</p>}
                  {item.vape.puffs && <p className="text-[10px] text-neutral-content/50 font-mono">{item.vape.puffs} puffs</p>}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-bold shadow-lg ${item.cantidad === 0 ? 'bg-error text-error-content' : item.cantidad < 5 ? 'bg-warning text-warning-content' : 'bg-primary text-primary-content'}`}>
                  {item.cantidad} unds
                </div>
              </div>
              
              <div className="space-y-2 mt-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-content/70">Precio Sugerido:</span>
                  <span className="font-mono text-primary font-bold">${parseFloat(item.vape.precio).toFixed(2)}</span>
                </div>
                {item.vape.precioVendedor && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-content/70">Tu precio al admin:</span>
                    <span className="font-mono text-warning font-bold">${parseFloat(item.vape.precioVendedor).toFixed(2)}</span>
                  </div>
                )}
                {item.vape.descripcion && (
                  <p className="text-xs text-neutral-content/60 italic line-clamp-2 mt-2">{item.vape.descripcion}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {inventario.length === 0 && !loading && !error && (
        <div className="glass-card p-12 rounded-3xl text-center flex flex-col items-center">
          <Package className="w-16 h-16 text-neutral-content/20 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Sin Inventario</h3>
          <p className="text-neutral-content/70 max-w-md">
            Aún no tienes vapes asignados para vender. Contacta a un administrador para que te asigne stock.
          </p>
        </div>
      )}
    </div>
  );
}
