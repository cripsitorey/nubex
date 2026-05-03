"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { getVapes } from "@/services/api";
import { getCachedCatalog } from "@/lib/syncService";
import { PackageSearch, ShoppingBag } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000";

export default function TiendaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [vapes, setVapes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVape, setSelectedVape] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role !== "CLIENTE") router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === "CLIENTE") {
      loadCatalog();
    }
  }, [user]);

  async function loadCatalog() {
    try {
      if (navigator.onLine) {
        const data = await getVapes();
        const vapesArr = Array.isArray(data) ? data : data.data || [];
        setVapes(vapesArr);
        setIsLoading(false);
        return;
      }
    } catch {
      // Fallback to cache
    }

    const { vapes } = await getCachedCatalog();
    setVapes(vapes || []);
    setIsLoading(false);
  }

  const resolveImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url}`;
  };

  if (loading || !user || user.role !== "CLIENTE") return null;

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <ShoppingBag className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Tienda Nubex</h1>
          <p className="text-sm text-neutral-content/60">Catálogo de productos disponibles</p>
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="glass-card rounded-2xl h-56 animate-pulse" />
            ))}
          </div>
        ) : vapes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {vapes.map(vape => {
              // Legacy support para imagenUrl principal
              const mainImg = vape.media && vape.media.length > 0 
                ? (vape.media[0].type === 'image' ? resolveImageUrl(vape.media[0].url) : resolveImageUrl(vape.imagenUrl))
                : resolveImageUrl(vape.imagenUrl);

              return (
              <div 
                key={vape.id} 
                onClick={() => setSelectedVape(vape)}
                className="glass-card p-4 rounded-2xl flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer group hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]"
              >
                <div className="w-full h-32 bg-base-300 rounded-xl mb-3 flex items-center justify-center overflow-hidden relative">
                  {mainImg ? (
                    <img 
                      src={mainImg} 
                      alt={vape.nombre} 
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <PackageSearch className="w-8 h-8 text-neutral-content/20" />
                  )}
                  {vape.stockGlobal <= 0 && (
                    <div className="absolute inset-0 bg-base-100/80 backdrop-blur-sm flex items-center justify-center">
                      <span className="bg-error text-error-content text-xs font-bold px-2 py-1 rounded-full">
                        Agotado
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm truncate text-white" title={vape.nombre}>{vape.nombre}</h4>
                  {vape.sabor && <p className="text-xs text-primary/80 truncate">{vape.sabor}</p>}
                  {vape.puffs && <p className="text-[10px] text-neutral-content/50 font-mono">{vape.puffs} puffs</p>}
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-lg text-primary font-bold">
                      {vape.mostrarPrecio !== false ? `$${parseFloat(vape.precio).toFixed(2)}` : "Consultar"}
                    </p>
                    {vape.stockGlobal > 0 && vape.stockGlobal <= 3 && (
                      <span className="text-[10px] text-warning uppercase font-mono font-bold">
                        Pocas unidades
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-3xl text-center flex flex-col items-center justify-center">
            <PackageSearch className="w-12 h-12 text-neutral-content/30 mb-4" />
            <p className="text-lg text-white font-bold mb-1">Catálogo Vacío</p>
            <p className="text-sm text-neutral-content/60">
              Actualmente no hay productos disponibles en la tienda.
            </p>
          </div>
        )}
      </div>

      {/* MODAL DETALLE DE PRODUCTO */}
      {selectedVape && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200" onClick={() => setSelectedVape(null)}>
          <div className="glass-card max-w-xl w-full rounded-3xl overflow-hidden relative shadow-2xl border border-primary/20" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedVape(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-error transition-colors"
            >
              ✕
            </button>
            
            <div className="w-full h-64 bg-base-300 relative overflow-x-auto flex snap-x snap-mandatory hide-scrollbar">
              {selectedVape.media && selectedVape.media.length > 0 ? (
                selectedVape.media.map((m, i) => (
                  <div key={i} className="min-w-full h-full snap-center flex items-center justify-center bg-black/40 relative">
                    {m.type === 'video' || m.mimetype?.startsWith('video') ? (
                      <video src={resolveImageUrl(m.url)} controls className="max-w-full max-h-full object-contain" autoPlay muted loop />
                    ) : (
                      <img src={resolveImageUrl(m.url)} alt={`${selectedVape.nombre} - ${i}`} className="max-w-full max-h-full object-contain" />
                    )}
                    {selectedVape.media.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-mono text-white">
                        {i + 1}/{selectedVape.media.length}
                      </div>
                    )}
                  </div>
                ))
              ) : selectedVape.imagenUrl ? (
                <div className="min-w-full h-full snap-center flex items-center justify-center bg-black/40">
                  <img src={resolveImageUrl(selectedVape.imagenUrl)} alt={selectedVape.nombre} className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="min-w-full h-full flex items-center justify-center text-neutral-content/30">
                  <PackageSearch className="w-16 h-16" />
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start gap-4 mb-4">
                <h3 className="text-2xl font-bold text-white">{selectedVape.nombre}</h3>
                <span className="text-2xl font-bold text-primary">
                  {selectedVape.mostrarPrecio !== false ? `$${parseFloat(selectedVape.precio).toFixed(2)}` : "Consultar precio"}
                </span>
              </div>
              
              <div className="space-y-4">
                {(selectedVape.sabor || selectedVape.puffs) && (
                  <div className="flex flex-wrap gap-2">
                    {selectedVape.sabor && (
                      <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                        {selectedVape.sabor}
                      </span>
                    )}
                    {selectedVape.puffs && (
                      <span className="inline-flex items-center gap-1 bg-info/10 text-info px-3 py-1 rounded-full text-xs font-mono font-bold">
                        {selectedVape.puffs} puffs
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <h4 className="text-xs uppercase tracking-wider font-mono text-neutral-content/50 mb-1">Descripción</h4>
                  <p className="text-sm text-neutral-content/80 whitespace-pre-wrap leading-relaxed">
                    {selectedVape.descripcion || "Sin descripción detallada."}
                  </p>
                </div>

                {selectedVape.stockGlobal > 3 ? (
                  <div className="inline-flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-xl text-sm font-bold">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                    Disponible en Tienda
                  </div>
                ) : selectedVape.stockGlobal > 0 ? (
                  <div className="inline-flex items-center gap-2 bg-warning/10 text-warning px-3 py-1.5 rounded-xl text-sm font-bold">
                    <div className="w-2 h-2 rounded-full bg-warning animate-pulse"></div>
                    Pocas unidades restantes
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-error/10 text-error px-3 py-1.5 rounded-xl text-sm font-bold">
                    Agotado Temporalmente
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
