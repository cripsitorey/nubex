'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

function ModalPlan({ plan, onClose, onSave }) {
  const [modelos, setModelos] = useState([]);
  const [form, setForm] = useState(plan || {
    nombre: '', descripcion: '', tipo: 'VAPES_MES', valorLimite: '',
    maxPuffsPermitidosPorVape: '', diasEntreEntregas: 30, precio: '',
    todosLosVapes: true, penalizacionPorDia: 0, diasGraciaDevolucion: 7,
    modelosPermitidosIds: [],
  });
  const [saving, setSaving] = useState(false);
  useEscapeKey(onClose);

  useEffect(() => {
    api.get('/vapes').then(setModelos);
  }, []);

  const toggleModelo = (id) => {
    const ids = form.modelosPermitidosIds || [];
    setForm({ ...form, modelosPermitidosIds: ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (plan) await api.patch(`/suscripciones/planes/${plan.id}`, form);
      else await api.post('/suscripciones/planes', form);
      onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">{plan ? 'Editar plan' : 'Nuevo plan'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-control col-span-2">
              <label className="label"><span className="label-text">Nombre *</span></label>
              <input className="input input-bordered input-sm" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <div className="form-control col-span-2">
              <label className="label"><span className="label-text">Descripción</span></label>
              <textarea className="textarea textarea-bordered textarea-sm" rows={2} value={form.descripcion || ''} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Tipo de plan</span></label>
              <select className="select select-bordered select-sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                <option value="VAPES_MES">Vapes por periodo</option>
                <option value="PUFFS_MES">Puffs por periodo</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">{form.tipo === 'VAPES_MES' ? 'Cantidad de vapes' : 'Puffs totales'}</span></label>
              <input type="number" className="input input-bordered input-sm" value={form.valorLimite} onChange={(e) => setForm({ ...form, valorLimite: e.target.value })} required />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Puffs máx. por vape (opcional)</span></label>
              <input type="number" className="input input-bordered input-sm" value={form.maxPuffsPermitidosPorVape || ''} onChange={(e) => setForm({ ...form, maxPuffsPermitidosPorVape: e.target.value })} placeholder="Sin límite" />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Días entre entregas</span></label>
              <input type="number" className="input input-bordered input-sm" value={form.diasEntreEntregas} onChange={(e) => setForm({ ...form, diasEntreEntregas: e.target.value })} required />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Precio ($)</span></label>
              <input type="number" step="0.01" className="input input-bordered input-sm" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} required />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Multa por día sin devolver ($)</span></label>
              <input type="number" step="0.01" className="input input-bordered input-sm" value={form.penalizacionPorDia} onChange={(e) => setForm({ ...form, penalizacionPorDia: e.target.value })} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Días de gracia para devolver</span></label>
              <input type="number" className="input input-bordered input-sm" value={form.diasGraciaDevolucion} onChange={(e) => setForm({ ...form, diasGraciaDevolucion: e.target.value })} />
            </div>
          </div>

          <div className="divider text-xs">Vapes permitidos</div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={!!form.todosLosVapes} onChange={(e) => setForm({ ...form, todosLosVapes: e.target.checked })} />
            <span className="text-sm">Todos los vapes del catálogo</span>
          </label>

          {!form.todosLosVapes && (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {modelos.map((m) => (
                <label key={m.id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" className="checkbox checkbox-sm checkbox-primary"
                    checked={(form.modelosPermitidosIds || []).includes(m.id)}
                    onChange={() => toggleModelo(m.id)} />
                  {m.nombre} ({m.puffs} puffs)
                </label>
              ))}
            </div>
          )}

          <div className="modal-action">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? <span className="loading loading-spinner loading-xs" /> : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export default function SuscripcionesPage() {
  const [planes, setPlanes] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('planes');
  const [modal, setModal] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/suscripciones/planes?soloActivos=false'),
      api.get('/suscripciones'),
    ]).then(([pl, sus]) => { setPlanes(pl); setSuscripciones(sus); }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Suscripciones</h2>
        {tab === 'planes' && (
          <button className="btn btn-primary btn-sm gap-1" onClick={() => setModal({})}><Plus size={16} /> Nuevo plan</button>
        )}
      </div>

      <div className="tabs tabs-boxed w-fit">
        <button className={`tab ${tab === 'planes' ? 'tab-active' : ''}`} onClick={() => setTab('planes')}>Planes</button>
        <button className={`tab ${tab === 'activas' ? 'tab-active' : ''}`} onClick={() => setTab('activas')}>Activas</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>
      ) : tab === 'planes' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {planes.map((p) => (
            <div key={p.id} className={`card shadow-sm ${p.activo ? 'bg-base-100' : 'bg-base-200 opacity-60'}`}>
              <div className="card-body p-4">
                <div className="flex justify-between">
                  <h3 className="font-bold">{p.nombre}</h3>
                  <button className="btn btn-ghost btn-xs" onClick={() => setModal(p)}>Editar</button>
                </div>
                <p className="text-xs text-base-content/60">{p.descripcion}</p>
                <div className="text-sm space-y-1 mt-2">
                  <div className="flex justify-between"><span>Tipo:</span><span>{p.tipo}</span></div>
                  <div className="flex justify-between"><span>Límite:</span><span>{p.valorLimite}</span></div>
                  <div className="flex justify-between"><span>Días entre entregas:</span><span>{p.diasEntreEntregas}</span></div>
                  <div className="flex justify-between"><span>Precio:</span><span className="font-bold">${p.precio}</span></div>
                  {p.maxPuffsPermitidosPorVape && <div className="flex justify-between"><span>Máx puffs/vape:</span><span>{p.maxPuffsPermitidosPorVape}</span></div>}
                  <div className="flex justify-between"><span>Multa/día:</span><span>${p.penalizacionPorDia}</span></div>
                </div>
                {!p.activo && <span className="badge badge-error badge-sm mt-2">Inactivo</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm bg-base-100 rounded-box shadow-sm">
            <thead>
              <tr><th>Cliente</th><th>Plan</th><th>Tipo</th><th>Precio</th><th>Estado</th><th>Desde</th></tr>
            </thead>
            <tbody>
              {suscripciones.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">{s.cliente?.nombre}</td>
                  <td>{s.plan?.nombre}</td>
                  <td><span className="badge badge-ghost badge-sm">{s.tipo}</span></td>
                  <td>${s.precio}</td>
                  <td><span className={`badge badge-sm ${s.activa ? 'badge-success' : 'badge-error'}`}>{s.activa ? 'Activa' : 'Cancelada'}</span></td>
                  <td className="text-xs">{new Date(s.createdAt).toLocaleDateString('es')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <ModalPlan plan={modal.id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}
