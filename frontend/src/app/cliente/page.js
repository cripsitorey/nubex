'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Star, Package, Calendar, Battery, Clock, X } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import BuscadorProducto from '@/components/shared/BuscadorProducto';

function ModalPedirVape({ suscripcion, onClose, onSave }) {
  const [modelos, setModelos] = useState([]);
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [varianteId, setVarianteId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEscapeKey(onClose);

  useEffect(() => {
    if (suscripcion.todosLosVapes) {
      api.get('/vapes/publico').then((data) => {
        const max = suscripcion.maxPuffsPermitidosPorVape;
        setModelos(max ? data.filter((m) => m.puffs <= max) : data);
      });
    } else {
      setModelos(suscripcion.vapesPermitidos.map((v) => v.modelo));
    }
  }, [suscripcion]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post(`/suscripciones/${suscripcion.id}/solicitudes`, { varianteId });
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Pedir mi próximo vape</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Modelo</span></label>
            {modeloSeleccionado ? (
              <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
                <Package size={16} />
                <span className="flex-1 text-sm font-medium">{modeloSeleccionado.nombre} ({modeloSeleccionado.puffs} puffs)</span>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => { setModeloSeleccionado(null); setVarianteId(''); }}><X size={14} /></button>
              </div>
            ) : (
              <BuscadorProducto
                placeholder="Buscar modelo..."
                productos={modelos.map((m) => ({ id: m.id, label: m.nombre, sublabel: `${m.puffs} puffs`, item: m }))}
                onSelect={(p) => { setModeloSeleccionado(p.item); setVarianteId(''); }}
              />
            )}
          </div>
          {modeloSeleccionado && (
            <div className="form-control">
              <label className="label"><span className="label-text">Sabor</span></label>
              <select className="select select-bordered select-sm" value={varianteId} onChange={(e) => setVarianteId(e.target.value)} required>
                <option value="">Seleccionar sabor...</option>
                {modeloSeleccionado.variantes?.map((v) => <option key={v.id} value={v.id}>{v.sabor}</option>)}
              </select>
            </div>
          )}
          {error && <div className="alert alert-error text-sm py-2">{error}</div>}
          <div className="modal-action">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !varianteId}>
              {saving ? <span className="loading loading-spinner loading-xs" /> : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function VistaConSuscripcion({ suscripcion, onRefresh }) {
  const [entregas, setEntregas] = useState([]);
  const [modalPedir, setModalPedir] = useState(false);

  useEffect(() => {
    api.get(`/suscripciones/${suscripcion.id}/entregas`).then(setEntregas).catch(() => {});
  }, [suscripcion.id]);

  const ultimaEntrega = entregas[0];
  const proxima = ultimaEntrega ? new Date(ultimaEntrega.fechaProximaEntrega) : null;
  const hoy = new Date();
  const diasRestantes = proxima ? Math.ceil((proxima - hoy) / (1000 * 60 * 60 * 24)) : null;
  const solicitudPendiente = suscripcion.solicitudes?.[0];

  return (
    <div className="space-y-4">
      <div className="card bg-primary text-primary-content shadow">
        <div className="card-body">
          <h2 className="card-title">Mi suscripción</h2>
          <p className="text-sm opacity-80">{suscripcion.plan?.nombre}</p>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Tipo:</span>
              <span>{suscripcion.tipo === 'VAPES_MES' ? `${suscripcion.valorLimite} vapes/periodo` : `${suscripcion.valorLimite} puffs/periodo`}</span>
            </div>
            <div className="flex justify-between">
              <span>Precio:</span>
              <span>${suscripcion.precio}/mes</span>
            </div>
          </div>
        </div>
      </div>

      {solicitudPendiente ? (
        <div className="alert alert-warning shadow-sm">
          <Clock size={18} />
          <div>
            <p className="font-bold">Solicitud en revisión</p>
            <p className="text-sm">{solicitudPendiente.variante?.modelo?.nombre} – {solicitudPendiente.variante?.sabor}</p>
          </div>
        </div>
      ) : (
        <button className="btn btn-outline btn-block gap-2" onClick={() => setModalPedir(true)}>
          <Battery size={16} /> Se me acabó, quiero uno nuevo
        </button>
      )}

      {diasRestantes !== null && (
        <div className={`alert ${diasRestantes <= 0 ? 'alert-success' : 'alert-info'} shadow-sm`}>
          <Calendar size={18} />
          <div>
            {diasRestantes <= 0 ? (
              <p>Ya puedes solicitar tu próximo vape.</p>
            ) : (
              <p>Tu próximo vape estará disponible en <strong>{diasRestantes} días</strong></p>
            )}
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h3 className="font-bold text-sm mb-2">Historial de entregas</h3>
          {entregas.length === 0 ? (
            <p className="text-sm text-base-content/50">Sin entregas aún</p>
          ) : (
            <div className="space-y-2">
              {entregas.map((e) => (
                <div key={e.id} className="flex justify-between items-center text-sm p-2 bg-base-200 rounded-lg">
                  <div>
                    <p className="font-medium">{e.variante?.modelo?.nombre} – {e.variante?.sabor}</p>
                    <p className="text-xs text-base-content/50">{new Date(e.fechaEntrega).toLocaleDateString('es')}</p>
                  </div>
                  {e.multaAplicada > 0 && <span className="badge badge-error badge-sm">Multa ${e.multaAplicada}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalPedir && (
        <ModalPedirVape
          suscripcion={suscripcion}
          onClose={() => setModalPedir(false)}
          onSave={() => { setModalPedir(false); onRefresh(); }}
        />
      )}
    </div>
  );
}

function VistaSinSuscripcion({ logros, ventas }) {
  return (
    <div className="space-y-4">
      {logros.filter((l) => !l.reclamado).length > 0 && (
        <div className="alert alert-warning shadow-sm">
          <Star size={18} />
          <span>Tienes <strong>{logros.filter((l) => !l.reclamado).length}</strong> recompensa(s) pendiente(s) de reclamar</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h3 className="font-bold">Mis compras</h3>
          {ventas.length === 0 ? (
            <p className="text-sm text-base-content/50 mt-2">Sin compras registradas</p>
          ) : (
            <div className="space-y-2 mt-2">
              {ventas.map((v) => (
                <div key={v.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{v.variante?.modelo?.nombre} – {v.variante?.sabor}</p>
                    <p className="text-xs text-base-content/50">{new Date(v.createdAt).toLocaleDateString('es')}</p>
                  </div>
                  <span className="font-bold">${v.precioVenta}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ClientePage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get(`/users/${user.id}`).then(setData).finally(() => setLoading(false));
  };

  useEffect(load, [user.id]);

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="avatar placeholder">
          <div className="bg-primary text-primary-content rounded-full w-12">
            <span className="text-xl">{data.nombre[0]}</span>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold">{data.nombre}</h2>
          <p className="text-sm text-base-content/50">{data.telefono || data.email}</p>
        </div>
      </div>

      {data.suscripcion?.activa ? (
        <VistaConSuscripcion suscripcion={data.suscripcion} onRefresh={load} />
      ) : (
        <VistaSinSuscripcion logros={data.logros || []} ventas={data.ventasComoCliente || []} />
      )}
    </div>
  );
}
