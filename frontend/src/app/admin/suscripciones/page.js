'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, ChevronDown, ChevronUp, Search, User, Check, X } from 'lucide-react';
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

function BuscadorCliente({ onSelect }) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    if (q.length < 2) { setResultados([]); return; }
    const t = setTimeout(() => api.get(`/users/search?q=${q}`).then(setResultados), 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="relative">
      <div className="join w-full">
        <span className="join-item btn btn-sm btn-ghost border border-base-300"><Search size={14} /></span>
        <input
          className="input input-bordered input-sm join-item flex-1"
          placeholder="Buscar cliente por nombre, teléfono..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {resultados.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-base-100 border border-base-200 rounded-box shadow-lg max-h-48 overflow-y-auto">
          {resultados.map((c) => (
            <li key={c.id}>
              <button type="button" className="w-full text-left px-3 py-2 hover:bg-base-200 flex items-center gap-2 text-sm"
                onClick={() => { onSelect(c); setQ(''); setResultados([]); }}>
                <User size={14} />
                <span className="font-medium">{c.nombre}</span>
                {c.telefono && <span className="text-base-content/50">{c.telefono}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ModalSuscribir({ planes, onClose, onSave }) {
  const [cliente, setCliente] = useState(null);
  const [planId, setPlanId] = useState('');
  const [multaFijaAdicional, setMultaFijaAdicional] = useState('');
  const [saving, setSaving] = useState(false);
  useEscapeKey(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/suscripciones', {
        clienteId: cliente.id,
        planId,
        multaFijaAdicional: multaFijaAdicional || undefined,
      });
      onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Suscribir cliente a un plan</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Cliente</span></label>
            {cliente ? (
              <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
                <User size={16} />
                <span className="flex-1 text-sm font-medium">{cliente.nombre}</span>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => setCliente(null)}><X size={14} /></button>
              </div>
            ) : (
              <BuscadorCliente onSelect={setCliente} />
            )}
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Plan</span></label>
            <select className="select select-bordered select-sm" value={planId} onChange={(e) => setPlanId(e.target.value)} required>
              <option value="">Seleccionar plan...</option>
              {planes.filter((p) => p.activo).map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} (${p.precio})</option>
              ))}
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text text-xs">Multa fija adicional (opcional)</span></label>
            <input type="number" step="0.01" className="input input-bordered input-sm" value={multaFijaAdicional} onChange={(e) => setMultaFijaAdicional(e.target.value)} />
          </div>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !cliente || !planId}>
              {saving ? <span className="loading loading-spinner loading-xs" /> : 'Suscribir'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function ModalProcesarSolicitud({ solicitud, onClose, onSave }) {
  const [vapeAnteriorDevuelto, setVapeAnteriorDevuelto] = useState(true);
  const [multaManual, setMultaManual] = useState('');
  const [saving, setSaving] = useState(false);
  useEscapeKey(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/suscripciones/${solicitud.suscripcionId}/entregas`, {
        varianteId: solicitud.varianteId,
        vapeAnteriorDevuelto,
        multaManual: multaManual || undefined,
        solicitudId: solicitud.id,
      });
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
        <h3 className="font-bold text-lg mb-4">Entregar sabor solicitado</h3>
        <div className="mb-3 p-3 bg-base-200 rounded-lg text-sm">
          <p><strong>{solicitud.suscripcion?.cliente?.nombre}</strong></p>
          <p className="text-base-content/60">{solicitud.variante?.modelo?.nombre} – {solicitud.variante?.sabor}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={vapeAnteriorDevuelto} onChange={(e) => setVapeAnteriorDevuelto(e.target.checked)} />
            <span className="text-sm">¿Devolvió el vape anterior quemado?</span>
          </label>
          {!vapeAnteriorDevuelto && (
            <div className="form-control">
              <label className="label"><span className="label-text text-xs">Multa manual (opcional, si no se devuelve automático por días de retraso)</span></label>
              <input type="number" step="0.01" className="input input-bordered input-sm" value={multaManual} onChange={(e) => setMultaManual(e.target.value)} />
            </div>
          )}
          <div className="modal-action">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-xs" /> : 'Confirmar entrega'}
            </button>
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
  const [solicitudes, setSolicitudes] = useState([]);
  const [modal, setModal] = useState(null);
  const [modalSuscribir, setModalSuscribir] = useState(false);
  const [modalSolicitud, setModalSolicitud] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/suscripciones/planes?soloActivos=false'),
      api.get('/suscripciones'),
      api.get('/suscripciones/solicitudes'),
    ]).then(([pl, sus, sol]) => { setPlanes(pl); setSuscripciones(sus); setSolicitudes(sol); }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const rechazar = async (id) => {
    if (!confirm('¿Rechazar esta solicitud?')) return;
    await api.patch(`/suscripciones/solicitudes/${id}/rechazar`, {});
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Suscripciones</h2>
        {tab === 'planes' && (
          <button className="btn btn-primary btn-sm gap-1" onClick={() => setModal({})}><Plus size={16} /> Nuevo plan</button>
        )}
        {tab === 'activas' && (
          <button className="btn btn-primary btn-sm gap-1" onClick={() => setModalSuscribir(true)}><Plus size={16} /> Suscribir cliente</button>
        )}
      </div>

      <div className="tabs tabs-boxed w-fit">
        <button className={`tab ${tab === 'planes' ? 'tab-active' : ''}`} onClick={() => setTab('planes')}>Planes</button>
        <button className={`tab ${tab === 'activas' ? 'tab-active' : ''}`} onClick={() => setTab('activas')}>Activas</button>
        <button className={`tab gap-1 ${tab === 'solicitudes' ? 'tab-active' : ''}`} onClick={() => setTab('solicitudes')}>
          Solicitudes {solicitudes.length > 0 && <span className="badge badge-primary badge-xs">{solicitudes.length}</span>}
        </button>
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
      ) : tab === 'activas' ? (
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
      ) : (
        <div className="space-y-3">
          {solicitudes.length === 0 ? (
            <p className="text-sm text-base-content/50 py-10 text-center">No hay solicitudes pendientes</p>
          ) : solicitudes.map((s) => (
            <div key={s.id} className="card bg-base-100 shadow-sm">
              <div className="card-body p-4 flex-row justify-between items-center">
                <div>
                  <p className="font-bold">{s.suscripcion?.cliente?.nombre}</p>
                  <p className="text-sm text-base-content/60">{s.variante?.modelo?.nombre} – {s.variante?.sabor}</p>
                  <p className="text-xs text-base-content/40">{new Date(s.createdAt).toLocaleString('es')}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-ghost btn-sm btn-square" title="Rechazar" onClick={() => rechazar(s.id)}><X size={16} /></button>
                  <button className="btn btn-primary btn-sm gap-1" onClick={() => setModalSolicitud(s)}><Check size={14} /> Entregar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <ModalPlan plan={modal.id ? modal : null} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />
      )}

      {modalSuscribir && (
        <ModalSuscribir planes={planes} onClose={() => setModalSuscribir(false)} onSave={() => { setModalSuscribir(false); load(); }} />
      )}

      {modalSolicitud && (
        <ModalProcesarSolicitud solicitud={modalSolicitud} onClose={() => setModalSolicitud(null)} onSave={() => { setModalSolicitud(null); load(); }} />
      )}
    </div>
  );
}
