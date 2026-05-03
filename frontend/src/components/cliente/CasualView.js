"use client";

import { useEffect, useState } from "react";
import { getVapes } from "@/services/api";
import { getCachedCatalog } from "@/lib/syncService";
import { Gift, PackageSearch } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000";

export default function CasualView({ user }) {
  const [vapes, setVapes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Límite de fidelidad dinámico (controlado por Admin en el backend)
  const MAX_VAPES = user.loyaltyLimit || 6;
  const progreso = (user.totalVapesComprados || 0) % MAX_VAPES;
  const porcentaje = (progreso / MAX_VAPES) * 100;

  useEffect(() => {
    async function loadCatalog() {
      try {
        // Intentar online primero
        if (navigator.onLine) {
          const data = await getVapes();
          const vapesArr = Array.isArray(data) ? data : data.data || [];
          // Filtrar vapes agotados globalmente
          const availableVapes = vapesArr.filter(v => typeof v.stockTotal !== 'undefined' ? v.stockTotal > 0 : true);
          setVapes(availableVapes);
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to cache
      }

      const { vapes } = await getCachedCatalog();
      // Filtrar vapes agotados globalmente
      const availableVapes = (vapes || []).filter(v => typeof v.stockTotal !== 'undefined' ? v.stockTotal > 0 : true);
      setVapes(availableVapes);
      setLoading(false);
    }
    loadCatalog();
  }, []);

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url}`;
  };

  return (
    <div className="space-y-6">
      {/* Loyalty Progress Card */}
      <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-sans text-white">Fidelidad</h2>
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
        </div>

        {user.logros && user.logros.length > 0 ? (
          <div className="bg-success/20 text-success-content p-3 rounded-xl mb-4 text-sm font-bold flex items-center gap-2">
            <Gift className="w-4 h-4" />
            ¡Tienes un vape gratis esperando! Pídelo en tu próxima compra.
          </div>
        ) : (
          <p className="text-sm text-neutral-content/70 mb-4">
            ¡Estás a <span className="text-white font-bold">{MAX_VAPES - progreso}</span> vapes de llevarte uno gratis!
          </p>
        )}

        <div className="w-full h-3 bg-base-300 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-success transition-all duration-1000 ease-out"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono text-neutral-content/50">
          <span>{progreso}</span>
          <span>{MAX_VAPES}</span>
        </div>
      </div>

      {/* Catalog */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <PackageSearch className="w-5 h-5 text-primary" />
          Catálogo Disponible
        </h3>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : vapes.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {vapes.map(vape => {
              const mainImg = vape.media && vape.media.length > 0 
                ? (vape.media[0].type === 'image' ? resolveImageUrl(vape.media[0].url) : resolveImageUrl(vape.imagenUrl))
                : resolveImageUrl(vape.imagenUrl);

              return (
              <div key={vape.id} className="glass-card p-4 rounded-2xl flex flex-col justify-between">
                <div className="w-full h-24 bg-base-300 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                  {mainImg ? (
                    <img src={mainImg} alt={vape.nombre} className="object-cover w-full h-full" />
                  ) : (
                    <PackageSearch className="w-8 h-8 text-neutral-content/20" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm truncate text-white">{vape.nombre}</h4>
                  <p className="text-xs text-primary font-mono mt-1">
                    {vape.mostrarPrecio !== false ? `$${parseFloat(vape.precio).toFixed(2)}` : "Consultar"}
                  </p>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="glass-card p-8 rounded-3xl text-center text-neutral-content/50">
            No hay vapes disponibles en el catálogo.
          </div>
        )}
      </div>
    </div>
  );
}
