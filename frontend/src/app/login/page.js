"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, Eye, EyeOff, Zap } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(identifier, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -ml-32 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -mr-48 -mb-48 pointer-events-none" />

      <div className="glass-card p-8 rounded-3xl w-full max-w-md relative z-10 border border-white/10">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.3)]">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white font-sans">Nubex</h1>
          <p className="text-sm text-neutral-content/60 mt-1">Inicia sesión para continuar</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error/20 text-error p-3 rounded-xl text-sm border border-error/30 text-center mb-6 animate-in fade-in duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs text-neutral-content/60 uppercase font-mono tracking-wider">
              Cédula o Teléfono
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="V-12345678 o 04141234567"
              className="w-full bg-base-200 border-0 rounded-xl p-3.5 text-white mt-1 focus:ring-2 focus:ring-primary outline-none placeholder:text-neutral-content/30"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-content/60 uppercase font-mono tracking-wider">
              Contraseña
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-base-200 border-0 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-primary outline-none pr-12 placeholder:text-neutral-content/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-content/60 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-primary-content font-bold py-4 rounded-xl shadow-[0_0_25px_rgba(0,229,255,0.3)] hover:shadow-[0_0_35px_rgba(0,229,255,0.5)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 text-lg"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-content border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Entrar
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-content/40 mt-6">
          Nubex PWA v1.0 · Offline-First
        </p>
      </div>
    </div>
  );
}
