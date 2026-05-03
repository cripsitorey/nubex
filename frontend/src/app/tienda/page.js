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
            {vapes.map(vape => (
              <div key={vape.id} className="glass-card p-4 rounded-2xl flex flex-col justify-between hover:border-primary/50 transition-colors group">
                <div className="w-full h-32 bg-base-300 rounded-xl mb-3 flex items-center justify-center overflow-hidden relative">
                  {vape.imagenUrl ? (
                    <img 
                      src={resolveImageUrl(vape.imagenUrl)} 
                      alt={vape.nombre} 
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" 
                    />
                  ) : (
                    <PackageSearch className="w-8 h-8 text-neutral-content/20" />
                  )}
                  {vape.stock <= 0 && (
                    <div className="absolute inset-0 bg-base-100/80 backdrop-blur-sm flex items-center justify-center">
                      <span className="bg-error text-error-content text-xs font-bold px-2 py-1 rounded-full">
                        Agotado
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm truncate text-white" title={vape.nombre}>{vape.nombre}</h4>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-lg text-primary font-bold">${parseFloat(vape.precio).toFixed(2)}</p>
                    <span className="text-[10px] text-neutral-content/50 uppercase font-mono">
                      {vape.stock > 0 ? `${vape.stock} disp.` : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
    </div>
  );
}
