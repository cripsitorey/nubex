"use client";

import { useState, useEffect } from "react";
import { UserPlus, Wifi, WifiOff } from "lucide-react";
import { getCachedCatalog, addToSyncQueue } from "@/lib/syncService";
import { registerUser } from "@/services/api";
import { useNetwork } from "@/components/NetworkProvider";

export default function ClientRegistration({ onRegistered, standalone = false }) {
  const { isOnline } = useNetwork();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    cedula: "",
    password: "",
    planId: ""
  });
  const [planes, setPlanes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadPlanes() {
      const catalog = await getCachedCatalog();
      if (catalog && catalog.planes) {
        setPlanes(catalog.planes);
      }
    }
    loadPlanes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    // Intentar registro online directo
    if (isOnline) {
      try {
        const userData = {
          nombre: formData.nombre,
          password: formData.password || formData.cedula, // Default password = cedula
          cedula: formData.cedula,
          telefono: formData.telefono,
          email: formData.email || undefined,
        };

        const newUser = await registerUser(userData);
        
        setIsSubmitting(false);
        if (standalone) {
          setSuccess("Cliente registrado exitosamente.");
          setFormData({ nombre: "", email: "", telefono: "", cedula: "", password: "", planId: "" });
        } else if (onRegistered) {
          onRegistered({
            id: newUser.id,
            nombre: newUser.nombre,
            suscripcion: null,
            asignarSuscripcion: formData.planId !== "",
          });
        }
        return;
      } catch (err) {
        console.warn("Registro online falló, encolando offline:", err.message);
        setError("");
        // Fall through to offline
      }
    }

    // Fallback offline
    const tempId = -Math.floor(Math.random() * 1000000);
    const payload = {
      ...formData,
      password: formData.password || formData.cedula,
      tempId,
      asignarSuscripcion: formData.planId !== ""
    };

    await addToSyncQueue("USER_CREATION", payload);
    
    setIsSubmitting(false);
    if (standalone) {
      setSuccess("Cliente encolado offline exitosamente.");
      setFormData({ nombre: "", email: "", telefono: "", cedula: "", password: "", planId: "" });
    } else if (onRegistered) {
      onRegistered({ id: tempId, ...payload });
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-white">Nuevo Cliente</h3>
        <div className="ml-auto">
          {isOnline
            ? <Wifi className="w-4 h-4 text-success" />
            : <WifiOff className="w-4 h-4 text-warning" />
          }
        </div>
      </div>

      {error && (
        <div className="bg-error/20 text-error p-3 rounded-xl text-sm border border-error/30 text-center mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success/20 text-success p-3 rounded-xl text-sm border border-success/30 text-center mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-neutral-content/60 uppercase font-mono">Nombre Completo</label>
          <input type="text" name="nombre" required className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" value={formData.nombre} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-neutral-content/60 uppercase font-mono">Teléfono</label>
            <input type="tel" name="telefono" required className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" value={formData.telefono} onChange={handleChange} />
          </div>
          <div>
            <label className="text-xs text-neutral-content/60 uppercase font-mono">Cédula</label>
            <input type="text" name="cedula" className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" value={formData.cedula} onChange={handleChange} />
          </div>
        </div>

        <div>
          <label className="text-xs text-neutral-content/60 uppercase font-mono">Email (Opcional)</label>
          <input type="email" name="email" className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" value={formData.email} onChange={handleChange} />
        </div>

        <div>
          <label className="text-xs text-neutral-content/60 uppercase font-mono">Contraseña</label>
          <input type="password" name="password" placeholder="Por defecto: la cédula" className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none placeholder:text-neutral-content/30" value={formData.password} onChange={handleChange} />
        </div>

        <div>
          <label className="text-xs text-neutral-content/60 uppercase font-mono">Plan de Suscripción</label>
          <select name="planId" className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none appearance-none" value={formData.planId} onChange={handleChange}>
            <option value="">Cliente Casual (Sin Plan)</option>
            {planes.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.nombre} - Cada {plan.diasEntreEntregas} días
              </option>
            ))}
          </select>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-content font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-shadow mt-4"
        >
          {isSubmitting ? "Registrando..." : (isOnline ? "Registrar Cliente" : "Registrar Offline")}
        </button>
      </form>
    </div>
  );
}
