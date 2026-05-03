"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserCircle, LogOut } from "lucide-react";
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
