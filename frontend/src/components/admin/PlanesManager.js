"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Loader2, AlertCircle } from "lucide-react";
import { getPlans, createPlan, updatePlan, deletePlan } from "@/services/api";

export default function PlanesManager() {
  const [planes, setPlanes] = useState([]);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({ nombre: "", diasEntreEntregas: 30, precio: 0, limiteVapes: 1 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPlans();
      setPlanes(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleEdit = (plan) => {
    setIsEditing(plan.id);
    setFormData({
      nombre: plan.nombre,
      diasEntreEntregas: plan.diasEntreEntregas,
      precio: plan.precio,
      limiteVapes: plan.limiteVapes || 1,
    });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setFormData({ nombre: "", diasEntreEntregas: 30, precio: 0, limiteVapes: 1 });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (isEditing && isEditing !== "new") {
        await updatePlan(isEditing, formData);
      } else {
        await createPlan(formData);
      }
      handleCancel();
      await fetchPlans();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este plan?")) return;
    setError("");
    try {
      await deletePlan(id);
      await fetchPlans();
    } catch (err) {
      setError(err.message);
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Gestión de Planes Dinámicos</h2>
        {!isEditing && (
          <button 
            className="btn btn-primary btn-sm rounded-xl font-bold shadow-[0_0_15px_rgba(0,229,255,0.4)]"
            onClick={() => setIsEditing('new')}
          >
            <Plus className="w-4 h-4 mr-1" /> Nuevo Plan
          </button>
        )}
      </div>

      {error && (
        <div className="bg-error/20 text-error p-3 rounded-xl text-sm border border-error/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {isEditing && (
        <div className="glass-card p-6 rounded-3xl animate-in fade-in zoom-in duration-300 border border-primary/30">
          <h3 className="font-bold text-white mb-4">{isEditing === 'new' ? 'Crear Plan' : 'Editar Plan'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Nombre del Plan</label>
              <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Días entre entregas</label>
              <input type="number" required value={formData.diasEntreEntregas} onChange={e => setFormData({...formData, diasEntreEntregas: parseInt(e.target.value)})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Precio ($)</label>
              <input type="number" step="0.01" required value={formData.precio} onChange={e => setFormData({...formData, precio: parseFloat(e.target.value)})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Límite de Vapes</label>
              <input type="number" value={formData.limiteVapes} onChange={e => setFormData({...formData, limiteVapes: parseInt(e.target.value)})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={handleCancel} className="btn btn-ghost text-neutral-content hover:bg-white/10">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-primary shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto glass-card rounded-3xl">
        <table className="table w-full text-left">
          <thead className="text-neutral-content/60 font-mono text-xs uppercase border-b border-white/10">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Frecuencia</th>
              <th className="p-4">Precio</th>
              <th className="p-4">Límite</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {planes.map(plan => (
              <tr key={plan.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold text-white">{plan.nombre}</td>
                <td className="p-4"><span className="badge badge-outline badge-primary font-mono">{plan.diasEntreEntregas} días</span></td>
                <td className="p-4 font-mono text-success">${parseFloat(plan.precio).toFixed(2)}</td>
                <td className="p-4">{plan.limiteVapes || 'Sin límite'}</td>
                <td className="p-4 flex justify-end gap-2">
                  <button onClick={() => handleEdit(plan)} className="btn btn-xs btn-ghost btn-circle text-neutral-content hover:text-white"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(plan.id)} className="btn btn-xs btn-ghost btn-circle text-error hover:bg-error/20"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {planes.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-neutral-content/50">
                  No hay planes registrados. Crea el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
