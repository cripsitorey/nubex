'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const ESTADOS = { PENDIENTE_LIQUIDACION: 'badge-warning', LIQUIDADA: 'badge-success', GARANTIA: 'badge-error' };

export default function VentasAdminPage() {
  const [ventas, setVentas] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ estado: '', desde: '', hasta: '', page: 1 });

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtros.estado) params.set('estado', filtros.estado);
    if (filtros.desde) params.set('desde', filtros.desde);
    if (filtros.hasta) params.set('hasta', filtros.hasta);
    params.set('page', filtros.page);
    api.get(`/ventas?${params}`).then(({ data, total }) => {
      setVentas(data);
      setTotal(total);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [filtros]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Ventas</h2>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <div className="flex flex-wrap gap-3">
            <select className="select select-bordered select-sm" value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value, page: 1 })}>
              <option value="">Todos los estados</option>
              <option value="PENDIENTE_LIQUIDACION">Pendiente</option>
              <option value="LIQUIDADA">Liquidada</option>
              <option value="GARANTIA">Garantía</option>
            </select>
            <input type="date" className="input input-bordered input-sm" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value, page: 1 })} />
            <input type="date" className="input input-bordered input-sm" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value, page: 1 })} />
          </div>
        </div>
      </div>

      <div className="text-sm text-base-content/60">{total} ventas encontradas</div>

      {loading ? (
        <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm bg-base-100 rounded-box shadow-sm">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Vendedor</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Admin</th>
                <th>Vendedor</th>
                <th>Método</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v.id} className="hover">
                  <td className="whitespace-nowrap text-xs">{new Date(v.createdAt).toLocaleDateString('es')}</td>
                  <td>{v.vendedor?.nombre}</td>
                  <td>{v.cliente?.nombre || <span className="text-base-content/40">Anónimo</span>}</td>
                  <td className="text-xs">{v.variante?.modelo?.nombre} – {v.variante?.sabor}</td>
                  <td>{v.cantidad}</td>
                  <td>${v.precioVenta.toFixed(2)}</td>
                  <td className="text-success">${v.montoParaAdmin.toFixed(2)}</td>
                  <td>${v.montoParaVendedor.toFixed(2)}</td>
                  <td><span className="badge badge-ghost badge-sm">{v.metodoPago}</span></td>
                  <td><span className={`badge badge-sm ${ESTADOS[v.estado]}`}>{v.estado.replace('_', ' ')}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center gap-2">
        <button className="btn btn-sm" disabled={filtros.page <= 1} onClick={() => setFiltros({ ...filtros, page: filtros.page - 1 })}>Anterior</button>
        <span className="btn btn-sm btn-ghost no-animation">Página {filtros.page}</span>
        <button className="btn btn-sm" disabled={ventas.length < 50} onClick={() => setFiltros({ ...filtros, page: filtros.page + 1 })}>Siguiente</button>
      </div>
    </div>
  );
}
