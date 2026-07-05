'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { User, ShoppingBag, X } from 'lucide-react';
import BuscadorCliente from '@/components/shared/BuscadorCliente';
import BuscadorProducto from '@/components/shared/BuscadorProducto';

export default function VentaAdminPage() {
  const [modelos, setModelos] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [variante, setVariante] = useState(null);
  const [form, setForm] = useState({ cantidad: 1, precioVenta: '', metodoPago: 'EFECTIVO', notas: '' });
  const [esGarantia, setEsGarantia] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/vapes').then(setModelos).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const variantesConStock = modelos.flatMap((m) =>
    (m.variantes || []).filter((v) => v.stock > 0).map((v) => ({ ...v, modeloNombre: m.nombre }))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        varianteId: variante.id,
        clienteId: cliente?.id,
        esGarantia,
        ...form,
      };
      const res = await api.post('/ventas', body);
      setResultado(res);
      setVariante(null);
      setCliente(null);
      setEsGarantia(false);
      setForm({ cantidad: 1, precioVenta: '', metodoPago: 'EFECTIVO', notas: '' });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg" /></div>;

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold">Vender</h2>

      {resultado && (
        <div className="alert alert-success shadow-sm">
          <div>
            <p className="font-bold">Venta registrada</p>
            {resultado.alertaFidelidad && <p className="text-sm mt-1">{resultado.alertaFidelidad}</p>}
          </div>
          <button onClick={() => setResultado(null)}><X size={16} /></button>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4 space-y-4">
          <div>
            <label className="label"><span className="label-text font-medium">Cliente (opcional)</span></label>
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

          <div>
            <label className="label"><span className="label-text font-medium">Producto (bodega central)</span></label>
            {variante ? (
              <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
                <ShoppingBag size={16} />
                <span className="flex-1 text-sm font-medium">{variante.modeloNombre} – {variante.sabor} ({variante.stock} disp.)</span>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => setVariante(null)}><X size={14} /></button>
              </div>
            ) : (
              <BuscadorProducto
                placeholder="Buscar producto por nombre o sabor..."
                productos={variantesConStock.map((v) => ({
                  id: v.id,
                  label: `${v.modeloNombre} – ${v.sabor}`,
                  sublabel: `Stock: ${v.stock}`,
                  item: v,
                }))}
                onSelect={(p) => setVariante(p.item)}
              />
            )}
          </div>

          {variante && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={esGarantia} onChange={(e) => setEsGarantia(e.target.checked)} />
                Es un cambio por garantía (sin cobro)
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Cantidad</span></label>
                  <input type="number" min="1" max={variante.stock} className="input input-bordered input-sm"
                    value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} required />
                </div>
                {!esGarantia && (
                  <div className="form-control">
                    <label className="label"><span className="label-text text-xs">Precio de venta ($)</span></label>
                    <input type="number" step="0.01" className="input input-bordered input-sm"
                      value={form.precioVenta} onChange={(e) => setForm({ ...form, precioVenta: e.target.value })} required />
                  </div>
                )}
                <div className="form-control">
                  <label className="label"><span className="label-text text-xs">Método de pago</span></label>
                  <select className="select select-bordered select-sm" value={form.metodoPago} onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                  </select>
                </div>
              </div>

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
