'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, ShoppingBag, Users, Repeat } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [grafico, setGrafico] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dashboard'),
      api.get('/analytics/ventas-por-periodo'),
    ]).then(([dash, graf]) => {
      setData(dash);
      setGrafico(graf);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg" /></div>;
  if (!data) return null;

  const stats = [
    { label: 'Ingresos admin', value: `$${data.ventas.ingresoAdmin.toFixed(2)}`, icon: TrendingUp, color: 'text-success' },
    { label: 'Total ventas', value: data.ventas.total, icon: ShoppingBag, color: 'text-primary' },
    { label: 'Clientes', value: data.clientes.total, icon: Users, color: 'text-info' },
    { label: 'Suscripciones', value: data.clientes.conSuscripcion, icon: Repeat, color: 'text-warning' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat bg-base-100 rounded-box shadow-sm">
            <div className={`stat-figure ${s.color}`}><s.icon size={28} /></div>
            <div className="stat-title text-xs">{s.label}</div>
            <div className="stat-value text-2xl">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title text-base">Ventas últimos 30 días</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="ventas" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-base">Top 5 productos</h3>
            <div className="space-y-2">
              {data.topVariantes.map((v, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span>{v.variante?.modelo?.nombre} – {v.variante?.sabor}</span>
                  <span className="badge badge-primary badge-sm">{v.cantidadVendida} uds</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="card-title text-base">Top vendedores</h3>
            <div className="space-y-2">
              {data.topVendedores.map((v, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span>{v.vendedor?.nombre}</span>
                  <span className="badge badge-secondary badge-sm">{v.totalVentas} ventas</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h3 className="card-title text-base">Caja</h3>
          <div className="flex gap-6 flex-wrap text-sm">
            <div><span className="text-success font-bold">+${data.caja.ingresos.toFixed(2)}</span> ingresos</div>
            <div><span className="text-error font-bold">-${data.caja.egresos.toFixed(2)}</span> egresos</div>
            <div><span className="font-bold">${data.caja.balance.toFixed(2)}</span> balance</div>
          </div>
        </div>
      </div>
    </div>
  );
}
