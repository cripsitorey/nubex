'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const ESTADO_COLOR = { PENDIENTE_LIQUIDACION: 'badge-warning', LIQUIDADA: 'badge-success', GARANTIA: 'badge-error' };

export default function MisVentas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ventas').then(({ data }) => setVentas(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg" /></div>;

  const total = ventas.reduce((s, v) => s + v.montoParaVendedor, 0);
  const pendiente = ventas.filter((v) => v.estado === 'PENDIENTE_LIQUIDACION').reduce((s, v) => s + v.montoParaVendedor, 0);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Mis ventas</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="stat bg-base-100 rounded-box shadow-sm">
          <div className="stat-title text-xs">Total ganado</div>
          <div className="stat-value text-xl text-primary">${total.toFixed(2)}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow-sm">
          <div className="stat-title text-xs">Pendiente liquidar</div>
          <div className="stat-value text-xl text-warning">${pendiente.toFixed(2)}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-sm bg-base-100 rounded-box shadow-sm">
          <thead>
            <tr><th>Fecha</th><th>Producto</th><th>Cliente</th><th>Cant.</th><th>Precio</th><th>Mi ganancia</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.id} className="hover">
                <td className="text-xs whitespace-nowrap">{new Date(v.createdAt).toLocaleDateString('es')}</td>
                <td className="text-xs">{v.variante?.modelo?.nombre} – {v.variante?.sabor}</td>
                <td>{v.cliente?.nombre || <span className="text-base-content/40">Anónimo</span>}</td>
                <td>{v.cantidad}</td>
                <td>${v.precioVenta.toFixed(2)}</td>
                <td className="text-primary font-bold">${v.montoParaVendedor.toFixed(2)}</td>
                <td><span className={`badge badge-sm ${ESTADO_COLOR[v.estado]}`}>{v.estado.replace('_', ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
