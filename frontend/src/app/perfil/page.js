"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserCircle, LogOut, Gift, Clock, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Perfil() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-white mb-6">Perfil de Usuario</h1>
      
      <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center border-2 border-primary shrink-0">
             <UserCircle className="w-10 h-10 text-neutral-content" />
          </div>
          <div>
            <p className="text-xs text-primary font-mono tracking-wider mb-1">
              ROL: {user.role}
            </p>
            <p className="text-xl font-bold text-white leading-tight">{user.nombre}</p>
            <p className="text-sm text-neutral-content/60 mt-1">{user.email || user.cedula || user.telefono}</p>
          </div>
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="bg-base-200/50 p-4 rounded-2xl flex justify-between items-center">
            <span className="text-sm text-neutral-content">Teléfono</span>
            <span className="text-sm text-white font-mono">{user.telefono}</span>
          </div>
          <div className="bg-base-200/50 p-4 rounded-2xl flex justify-between items-center">
            <span className="text-sm text-neutral-content">Cédula</span>
            <span className="text-sm text-white font-mono">{user.cedula}</span>
          </div>
        </div>

        {/* Premios sin canjear */}
        {user.logros && user.logros.length > 0 && (
          <div className="bg-primary/20 border border-primary/30 p-4 rounded-2xl mb-8 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">¡Tienes un premio sin canjear!</h3>
              <p className="text-xs text-neutral-content/80 mt-1">Has alcanzado tu meta de fidelidad y tienes un vape gratis esperándote. Pídelo a tu vendedor.</p>
            </div>
          </div>
        )}

        {/* Historial de Compras */}
        {user.role === 'CLIENTE' && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              Historial de Compras
            </h3>
            
            {!user.ventasCompradas || user.ventasCompradas.length === 0 ? (
              <div className="bg-base-200/50 p-6 rounded-2xl text-center">
                <ShoppingBag className="w-8 h-8 text-neutral-content/30 mx-auto mb-2" />
                <p className="text-sm text-neutral-content/60">Aún no has realizado compras.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {user.ventasCompradas.map((venta) => (
                  <div key={venta.id} className="bg-base-200/50 p-4 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-white">{venta.vape.nombre}</p>
                      <p className="text-xs text-neutral-content/60">{new Date(venta.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary font-mono">{venta.cantidad} unds</p>
                      <p className="text-xs text-neutral-content/60">${parseFloat(venta.precioVenta).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <button 
          onClick={logout}
          className="w-full btn btn-error text-white font-bold gap-2"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
