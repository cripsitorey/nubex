'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Star } from 'lucide-react';

export default function FidelidadPage() {
  const [configs, setConfigs] = useState([]);
  const [form, setForm] = useState({ comprasNecesarias: 6, tipoRecompensa: 'VAPE_GRATIS', valorDescuento: '' });
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/fidelidad/config').then(setConfigs);
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/fidelidad/config', form);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const activa = configs.find((c) => c.activo);

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-2xl font-bold">Programa de Fidelidad</h2>

      {activa && (
        <div className="card bg-primary text-primary-content shadow-sm">
          <div className="card-body p-4">
            <div className="flex items-center gap-2">
              <Star size={20} />
              <h3 className="font-bold">Regla activa</h3>
            </div>
            <p className="text-sm mt-1">
              Cada <strong>{activa.comprasNecesarias}</strong> compras el cliente recibe:{' '}
              {activa.tipoRecompensa === 'VAPE_GRATIS' ? 'un vape gratis' : `$${activa.valorDescuento} de descuento`}
            </p>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title text-base">Configurar nueva regla</h3>
          <p className="text-xs text-base-content/60">Al guardar, la regla anterior se desactiva.</p>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="form-control">
              <label className="label"><span className="label-text">Compras necesarias</span></label>
              <input type="number" min="1" className="input input-bordered input-sm" value={form.comprasNecesarias} onChange={(e) => setForm({ ...form, comprasNecesarias: e.target.value })} required />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Tipo de recompensa</span></label>
              <select className="select select-bordered select-sm" value={form.tipoRecompensa} onChange={(e) => setForm({ ...form, tipoRecompensa: e.target.value })}>
                <option value="VAPE_GRATIS">Vape gratis</option>
                <option value="DESCUENTO">Descuento ($)</option>
              </select>
            </div>
            {form.tipoRecompensa === 'DESCUENTO' && (
              <div className="form-control">
                <label className="label"><span className="label-text">Valor del descuento ($)</span></label>
                <input type="number" step="0.01" className="input input-bordered input-sm" value={form.valorDescuento} onChange={(e) => setForm({ ...form, valorDescuento: e.target.value })} required />
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-xs" /> : 'Activar nueva regla'}
            </button>
          </form>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title text-base">Historial de reglas</h3>
          <div className="space-y-2">
            {configs.map((c) => (
              <div key={c.id} className={`flex justify-between items-center p-2 rounded text-sm ${c.activo ? 'bg-primary/10' : 'bg-base-200'}`}>
                <span>{c.comprasNecesarias} compras → {c.tipoRecompensa === 'VAPE_GRATIS' ? 'Vape gratis' : `$${c.valorDescuento}`}</span>
                {c.activo && <span className="badge badge-primary badge-sm">Activa</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
