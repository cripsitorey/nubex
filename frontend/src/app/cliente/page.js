"use client";

import { useAuth } from "@/hooks/useAuth";
import CasualView from "@/components/cliente/CasualView";
import SubscribedView from "@/components/cliente/SubscribedView";
import QRGenerator from "@/components/cliente/QRGenerator";
import { UserCircle2, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ClienteDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center text-white">
        Por favor inicia sesión.
      </div>
    );
  }

  const isSubscribed = !!user.suscripcion?.activa;

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Profile */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-base-300 flex items-center justify-center border-2 border-primary">
          <UserCircle2 className="w-6 h-6 text-neutral-content" />
        </div>
        <div>
          <p className="text-xs text-neutral-content/60 uppercase tracking-wider font-mono">
            Bienvenido
          </p>
          <h1 className="text-xl font-bold text-white">{user.nombre}</h1>
        </div>
      </div>

      {/* Main View based on subscription */}
      <div className="relative">
        {isSubscribed ? <SubscribedView user={user} /> : <CasualView user={user} />}
      </div>

      {/* QR Section */}
      <div className="mt-8 pt-8 border-t border-white/10">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
          <QrCode className="w-5 h-5 text-primary" />
          Tu Código de Cliente
        </h3>
        <QRGenerator clienteId={user.id} />
      </div>
    </div>
  );
}
