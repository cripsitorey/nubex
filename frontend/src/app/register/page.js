"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowLeft, Loader2, Phone, Mail, User, ShieldCheck } from "lucide-react";
import { registerUser } from "@/services/api";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    cedula: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const userData = {
        nombre: formData.nombre,
        password: formData.password || formData.cedula,
        cedula: formData.cedula,
        telefono: formData.telefono,
        email: formData.email || undefined,
        role: "CLIENTE",
      };

      await registerUser(userData);
      router.push("/login?registered=true");
    } catch (err) {
      setError(err.message || "Error al registrarse. Inténtalo de nuevo.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-base-100 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-success/10 blur-[120px] rounded-full" />

      <Link
        href="/tienda"
        className="absolute top-8 left-8 flex items-center gap-2 text-neutral-content/60 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Volver a la tienda</span>
      </Link>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Únete a Nubex</h1>
          <p className="text-neutral-content/60 mt-2">Crea tu cuenta para disfrutar de nuestros vapes</p>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 relative z-10">
          {error && (
            <div className="bg-error/10 text-error p-4 rounded-2xl text-sm border border-error/20 text-center mb-6 animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-content/60 uppercase font-mono tracking-widest ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-content/40" />
                <input
                  type="text"
                  name="nombre"
                  required
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-base-200 border-0 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-neutral-content/20"
                  value={formData.nombre}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-content/60 uppercase font-mono tracking-widest ml-1">Cédula</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-content/40" />
                  <input
                    type="text"
                    name="cedula"
                    required
                    placeholder="1234567890"
                    className="w-full bg-base-200 border-0 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-neutral-content/20"
                    value={formData.cedula}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-neutral-content/60 uppercase font-mono tracking-widest ml-1">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-content/40" />
                  <input
                    type="tel"
                    name="telefono"
                    required
                    placeholder="099..."
                    className="w-full bg-base-200 border-0 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-neutral-content/20"
                    value={formData.telefono}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-neutral-content/60 uppercase font-mono tracking-widest ml-1">Email (Opcional)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-content/40" />
                <input
                  type="email"
                  name="email"
                  placeholder="tu@email.com"
                  className="w-full bg-base-200 border-0 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-neutral-content/20"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-neutral-content/60 uppercase font-mono tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-content/40" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-base-200 border-0 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-neutral-content/20"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-content font-bold py-4 rounded-2xl shadow-[0_0_30px_rgba(0,229,255,0.3)] hover:shadow-[0_0_40px_rgba(0,229,255,0.5)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creando cuenta...</span>
                </>
              ) : (
                "Registrarme"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-content/40">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
