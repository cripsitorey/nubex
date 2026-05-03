"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldAlert, ShieldCheck, UserCog, Loader2, AlertCircle, UserPlus } from "lucide-react";
import { getUsers, createUserByAdmin } from "@/services/api";

export default function VendedoresManager() {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "", cedula: "", telefono: "", email: "", password: "",
  });

  const fetchVendedores = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const users = await getUsers();
      const data = Array.isArray(users) ? users : users.data || [];
      setVendedores(data.filter(u => u.role === "VENDEDOR"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVendedores(); }, [fetchVendedores]);

  const handleCreateVendedor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createUserByAdmin({ ...formData, role: "VENDEDOR" });
      setShowForm(false);
      setFormData({ nombre: "", cedula: "", telefono: "", email: "", password: "" });
      await fetchVendedores();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error/20 text-error p-3 rounded-xl text-sm border border-error/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="glass-card p-6 rounded-3xl border border-primary/20 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" /> Vendedores Registrados
          </h3>
          <p className="text-sm text-neutral-content/60">{vendedores.length} vendedores en el sistema</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm rounded-xl font-bold shadow-[0_0_15px_rgba(0,229,255,0.4)]">
          <UserPlus className="w-4 h-4 mr-1" /> Nuevo Vendedor
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 rounded-3xl animate-in fade-in zoom-in duration-300 border border-primary/30">
          <h3 className="font-bold text-white mb-4">Registrar Vendedor</h3>
          <form onSubmit={handleCreateVendedor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Nombre</label>
              <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Cédula</label>
              <input type="text" required value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Teléfono</label>
              <input type="tel" required value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Contraseña</label>
              <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost text-neutral-content hover:bg-white/10">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-primary shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto glass-card rounded-3xl">
        <table className="table w-full text-left">
          <thead className="text-neutral-content/60 font-mono text-xs uppercase border-b border-white/10">
            <tr>
              <th className="p-4">Vendedor</th>
              <th className="p-4">Cédula</th>
              <th className="p-4">Teléfono</th>
              <th className="p-4">Email</th>
              <th className="p-4">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {vendedores.map(v => (
              <tr key={v.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold text-white">{v.nombre}</td>
                <td className="p-4 font-mono text-sm">{v.cedula || "—"}</td>
                <td className="p-4 text-sm">{v.telefono || "—"}</td>
                <td className="p-4 text-sm">{v.email || "—"}</td>
                <td className="p-4 text-xs text-neutral-content/60">
                  {v.createdAt ? new Date(v.createdAt).toLocaleDateString("es-VE") : "—"}
                </td>
              </tr>
            ))}
            {vendedores.length === 0 && (
              <tr><td colSpan="5" className="p-8 text-center text-neutral-content/50">No hay vendedores registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
