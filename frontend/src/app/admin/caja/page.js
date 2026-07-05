'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const CATEGORIAS = ['COMPRA_PROVEEDOR', 'VENTA', 'LIQUIDACION_VENDEDOR', 'GASTO_ENVIO', 'GASTO_OPERATIVO', 'OTRO'];

function ModalMovimiento({ onClose, onSave }) {
  const [form, setForm] = useState({ tipo: 'INGRESO', categoria: 'VENTA', monto: '', metodoPago: 'EFECTIVO', descripcion: '' });
  const [saving, setSaving] = useState(false);
  useEscapeKey(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/caja', form);
      onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-sm">
        <h3 className="font-bold text-lg mb-4">Nuevo movimiento</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <label className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-lg border-2 cursor-pointer text-sm font-medium ${form.tipo === 'INGRESO' ? 'border-success bg-success/10 text-success' : 'border-base-300'}`}>
              <input type="radio" className="hidden" value="INGRESO" checked={form.tipo === 'INGRESO'} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
              + Ingreso
            </label>
            <label className={`flex-1 flex items-center justify-center gap-1 p-2 rounded-lg border-2 cursor-pointer text-sm font-medium ${form.tipo === 'EGRESO' ? 'border-error bg-error/10 text-error' : 'border-base-300'}`}>
              <input type="radio" className="hidden" value="EGRESO" checked={form.tipo === 'EGRESO'} onChange={(e) => setForm({ ...form, tipo: e.target.value })} />
              - Egreso
            </label>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Categoría</span></label>
            <select className="select select-bordered select-sm" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Monto ($)</span></label>
            <input type="number" step="0.01" className="input input-bordered input-sm" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} required />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Método de pago</span></label>
            <select className="select select-bordered select-sm" value={form.metodoPago} onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Descripción</span></label>
            <textarea className="textarea textarea-bordered textarea-sm" rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
          </div>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? <span className="loading loading-spinner loading-xs" /> : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export default function CajaPage() {
  const [data, setData] = useState({ data: [], total: 0, resumen: { ingresos: 0, egresos: 0, balance: 0 } });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [filtros, setFiltros] = useState({ tipo: '', desde: '', hasta: '' });

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtros.tipo) params.set('tipo', filtros.tipo);
    if (filtros.desde) params.set('desde', filtros.desde);
    if (filtros.hasta) params.set('hasta', filtros.hasta);
    api.get(`/caja?${params}`).then(setData).finally(() => setLoading(false));
  };

  useEffect(load, [filtros]);

  const { resumen } = data;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Caja</h2>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setModal(true)}><Plus size={16} /> Movimiento</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="stat bg-base-100 rounded-box shadow-sm">
          <div className="stat-title text-xs">Ingresos</div>
          <div className="stat-value text-xl text-success">+${resumen.ingresos.toFixed(2)}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow-sm">
          <div className="stat-title text-xs">Egresos</div>
          <div className="stat-value text-xl text-error">-${resumen.egresos.toFixed(2)}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow-sm">
          <div className="stat-title text-xs">Balance</div>
          <div className={`stat-value text-xl ${resumen.balance >= 0 ? 'text-primary' : 'text-error'}`}>${resumen.balance.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="select select-bordered select-sm" value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
          <option value="">Todos</option>
          <option value="INGRESO">Ingresos</option>
          <option value="EGRESO">Egresos</option>
        </select>
        <input type="date" className="input input-bordered input-sm" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} />
        <input type="date" className="input input-bordered input-sm" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm bg-base-100 rounded-box shadow-sm">
            <thead>
              <tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Método</th><th>Monto</th><th>Registrado por</th></tr>
            </thead>
            <tbody>
              {data.data.map((m) => (
                <tr key={m.id}>
                  <td className="text-xs whitespace-nowrap">{new Date(m.createdAt).toLocaleDateString('es')}</td>
                  <td><span className={`badge badge-sm ${m.tipo === 'INGRESO' ? 'badge-success' : 'badge-error'}`}>{m.tipo}</span></td>
                  <td className="text-xs">{m.categoria.replace(/_/g, ' ')}</td>
                  <td className="max-w-xs truncate text-sm">{m.descripcion}</td>
                  <td className="text-xs">{m.metodoPago}</td>
                  <td className={`font-bold ${m.tipo === 'INGRESO' ? 'text-success' : 'text-error'}`}>
                    {m.tipo === 'INGRESO' ? '+' : '-'}${m.monto.toFixed(2)}
                  </td>
                  <td className="text-xs">{m.registradoPor?.nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && <ModalMovimiento onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}
    </div>
  );
}
