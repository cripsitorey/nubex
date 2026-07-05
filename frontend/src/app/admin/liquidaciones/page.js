'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus } from 'lucide-react';

export default function LiquidacionesPage() {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [vendedorId, setVendedorId] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/liquidaciones'),
      api.get('/users?role=VENDEDOR'),
    ]).then(([liq, { data }]) => { setLiquidaciones(liq); setVendedores(data); }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const crearLiquidacion = async () => {
    if (!vendedorId) return;
    setCreando(true);
    try {
      await api.post('/liquidaciones', { vendedorId });
      load();
      setVendedorId('');
    } catch (err) {
      alert(err.message);
    } finally {
      setCreando(false);
    }
  };

  const cerrar = async (id) => {
    if (!confirm('¿Cerrar esta liquidación?')) return;
    await api.patch(`/liquidaciones/${id}/cerrar`, {});
    load();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Liquidaciones</h2>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h3 className="font-bold text-sm mb-2">Nueva liquidación</h3>
          <div className="flex gap-2">
            <select className="select select-bordered select-sm flex-1" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
              <option value="">Seleccionar vendedor...</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
            <button className="btn btn-primary btn-sm gap-1" onClick={crearLiquidacion} disabled={creando || !vendedorId}>
              {creando ? <span className="loading loading-spinner loading-xs" /> : <><Plus size={16} /> Crear</>}
            </button>
          </div>
          <p className="text-xs text-base-content/50 mt-1">Agrupará todas las ventas PENDIENTE_LIQUIDACION del vendedor</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>
      ) : (
        <div className="space-y-3">
          {liquidaciones.map((l) => (
            <div key={l.id} className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{l.vendedor?.nombre}</h3>
                    <p className="text-sm text-base-content/60">{new Date(l.createdAt).toLocaleDateString('es')} · {l.ventas?.length || 0} ventas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">${l.montoTotal.toFixed(2)}</p>
                    {l.cerrada ? (
                      <span className="badge badge-success badge-sm">Cerrada</span>
                    ) : (
                      <button className="btn btn-sm btn-outline" onClick={() => cerrar(l.id)}>Cerrar</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
