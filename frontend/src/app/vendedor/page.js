'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { User, ShoppingBag, X, AlertCircle, WifiOff } from 'lucide-react';
import { cacheInventario, getCachedInventario, queueVenta } from '@/lib/syncService';
import { useNetwork } from '@/components/NetworkProvider';
import BuscadorCliente from '@/components/shared/BuscadorCliente';
import BuscadorProducto from '@/components/shared/BuscadorProducto';

export default function PuntoDeVenta() {
  const [inventario, setInventario] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [variante, setVariante] = useState(null);
  const [form, setForm] = useState({ cantidad: 1, precioVenta: '', metodoPago: 'EFECTIVO', pagadoA: 'VENDEDOR', notas: '' });
  const [reparto, setReparto] = useState({ tipo: 'PRECIO_FIJO', valor: '' });
  const [usarRepartoManual, setUsarRepartoManual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState(null);
  const net = useNetwork();

  useEffect(() => {
    api.get('/inventario')
      .then((data) => { setInventario(data); cacheInventario(data); })
      .catch(() => getCachedInventario().then(setInventario))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const body = {
      varianteId: variante.id,
      clienteId: cliente?.id,
      ...form,
      reparto: usarRepartoManual ? reparto : undefined,
    };
    const descontarStockLocal = () => {
      setInventario((prev) => prev.map((i) =>
        i.variante?.id === variante.id ? { ...i, cantidad: i.cantidad - Number(form.cantidad) } : i
      ));
    };
    const limpiarFormulario = () => {
      setVariante(null);
      setCliente(null);
      setForm({ cantidad: 1, precioVenta: '', metodoPago: 'EFECTIVO', pagadoA: 'VENDEDOR', notas: '' });
    };

    try {
      const res = await api.post('/ventas', body);
      setResultado(res);
      descontarStockLocal();
      limpiarFormulario();
    } catch (err) {
      if (err instanceof TypeError) {
        await queueVenta(body);
        descontarStockLocal();
        limpiarFormulario();
        setResultado({ offline: true });
        net?.refreshPending();
      } else {
        alert(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg" /></div>;

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold">Punto de venta</h2>

      {resultado && (
        <div className={`alert ${resultado.offline ? 'alert-warning' : 'alert-success'} shadow-sm`}>
          <div>
            {resultado.offline ? (
              <>
                <p className="font-bold flex items-center gap-1"><WifiOff size={14} /> Venta guardada sin conexión</p>
                <p className="text-sm mt-1">Se sincronizará automáticamente cuando vuelva la señal.</p>
              </>
            ) : (
              <>
                <p className="font-bold">Venta registrada</p>
                {resultado.alertaFidelidad && <p className="text-sm mt-1">{resultado.alertaFidelidad}</p>}
              </>
            )}
          </div>
          <button onClick={() => setResultado(null)}><X size={16} /></button>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4 space-y-4">
          {/* Cliente */}
          <div>
            <label className="label"><span className="label-text font-medium">Cliente (opcional)</span></label>
            {cliente ? (
              <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
                <User size={16} />
                <span className="flex-1 text-sm font-medium">{cliente.nombre}</span>
                <button className="btn btn-ghost btn-xs" onClick={() => setCliente(null)}><X size={14} /></button>
              </div>
            ) : (
              <BuscadorCliente onSelect={setCliente} />
            )}
          </div>

          {/* Producto */}
          <div>
            <label className="label"><span className="label-text font-medium">Producto</span></label>
            {variante ? (
              <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
                <ShoppingBag size={16} />
                <span className="flex-1 text-sm font-medium">{variante.modeloNombre} – {variante.sabor} ({variante.cantidad} disp.)</span>
                <button className="btn btn-ghost btn-xs" onClick={() => setVariante(null)}><X size={14} /></button>
              </div>
            ) : (
              <BuscadorProducto
                placeholder="Buscar producto por nombre o sabor..."
                productos={inventario.filter((i) => i.cantidad > 0).map((i) => ({
                  id: i.variante?.id,
                  label: `${i.variante?.modelo?.nombre} – ${i.variante?.sabor}`,
                  sublabel: `Stock: ${i.cantidad}`,
                  item: i,
                }))}
                onSelect={(p) => setVariante({ ...p.item.variante, modeloNombre: p.item.variante?.modelo?.nombre, cantidad: p.item.cantidad })}
              />
            )}
          </div>

          {variante && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Cantidad</span></label>
                  <input type="number" min="1" max={variante.cantidad} className="input input-bordered input-sm"
                    value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Precio de venta ($)</span></label>
                  <input type="number" step="0.01" className="input input-bordered input-sm"
                    value={form.precioVenta} onChange={(e) => setForm({ ...form, precioVenta: e.target.value })} required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Método de pago</span></label>
                  <select className="select select-bordered select-sm" value={form.metodoPago} onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Pagado a</span></label>
                  <select className="select select-bordered select-sm" value={form.pagadoA} onChange={(e) => setForm({ ...form, pagadoA: e.target.value })}>
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" className="checkbox checkbox-sm" checked={usarRepartoManual} onChange={(e) => setUsarRepartoManual(e.target.checked)} />
                Definir reparto manualmente (override)
              </label>

              {usarRepartoManual && (
                <div className="flex gap-2">
                  <select className="select select-bordered select-sm flex-1" value={reparto.tipo} onChange={(e) => setReparto({ ...reparto, tipo: e.target.value })}>
                    <option value="PRECIO_FIJO">Precio fijo al admin ($)</option>
                    <option value="PORCENTAJE">% para el admin</option>
                  </select>
                  <input type="number" step="0.01" className="input input-bordered input-sm w-28"
                    placeholder={reparto.tipo === 'PORCENTAJE' ? '% admin' : '$ admin'}
                    value={reparto.valor} onChange={(e) => setReparto({ ...reparto, valor: e.target.value })} />
                </div>
              )}

              <div className="form-control">
                <label className="label"><span className="label-text text-xs">Notas (opcional)</span></label>
                <input className="input input-bordered input-sm" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
                {submitting ? <span className="loading loading-spinner" /> : 'Registrar venta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
