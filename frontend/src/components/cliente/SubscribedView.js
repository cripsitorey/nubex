"use client";

import { Crown, CalendarClock, PackageCheck } from "lucide-react";

export default function SubscribedView({ user }) {
  const { suscripcion } = user;
  
  // Calcular días restantes
  const diasPlan = suscripcion.diasEntreEntregas || 30; // default 30
  let diasRestantes = 0;
  let porcentaje = 0;

  if (suscripcion.ultimaEntrega) {
    const ultima = new Date(suscripcion.ultimaEntrega);
    const hoy = new Date();
    const diffTime = Math.abs(hoy - ultima);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    diasRestantes = Math.max(0, diasPlan - diffDays);
    porcentaje = Math.min(100, (diffDays / diasPlan) * 100);
  }

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <div className="glass-card p-6 rounded-3xl relative overflow-hidden group border border-success/30 shadow-[0_0_30px_rgba(157,255,0,0.1)]">
        <div className="absolute top-0 right-0 w-40 h-40 bg-success/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold font-sans text-white">Mi Plan Activo</h2>
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-success" />
          </div>
        </div>

        <p className="text-3xl font-mono text-success font-bold my-4">
          Entrega cada {diasPlan} días
        </p>
      </div>

      {/* Status Card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-center">
          <CalendarClock className="w-6 h-6 text-primary mb-3" />
          <p className="text-xs text-neutral-content/60 uppercase tracking-wider mb-1">Próximo Vape</p>
          <p className="text-xl font-bold text-white">
            {diasRestantes === 0 ? "¡Disponible ya!" : `En ${diasRestantes} días`}
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl flex flex-col justify-center">
          <PackageCheck className="w-6 h-6 text-success mb-3" />
          <p className="text-xs text-neutral-content/60 uppercase tracking-wider mb-1">Estado</p>
          <p className="text-lg font-bold text-success">Activo</p>
        </div>
      </div>

      {/* Progress to next delivery */}
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="font-bold text-white mb-4">Progreso del periodo</h3>
        <div className="w-full h-4 bg-base-300 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-gradient-to-r from-success to-primary transition-all duration-1000 ease-out"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="text-xs text-center text-neutral-content/60 font-mono">
          {Math.ceil(porcentaje)}% completado
        </p>
      </div>
    </div>
  );
}
