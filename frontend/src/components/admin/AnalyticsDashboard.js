"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart as BarChart2 } from 'recharts';
import { Loader2, AlertCircle, TrendingUp, Users, ShoppingCart, DollarSign } from "lucide-react";
import { getAnalytics } from "@/services/api";

const COLORS = ['#00E5FF', '#9DFF00', '#FF0055', '#7C3AED', '#F59E0B', '#333333'];

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const analytics = await getAnalytics();
      setData(analytics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/20 text-error p-4 rounded-xl text-sm border border-error/30 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />{error}
      </div>
    );
  }

  if (!data) return null;

  const { dataRevenue, dataPlans, dataStock, kpis } = data;

  const dataRevenueFormatted = (dataRevenue || []).map(item => ({
    ...item,
    utilidad: item.ingresos - item.costo > 0 ? item.ingresos - item.costo : 0
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <ShoppingCart className="w-5 h-5 text-primary mb-2" />
          <p className="text-xs text-neutral-content/60 uppercase font-mono">Ventas</p>
          <p className="text-2xl font-bold text-white font-mono">{kpis.totalVentas}</p>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <DollarSign className="w-5 h-5 text-success mb-2" />
          <p className="text-xs text-neutral-content/60 uppercase font-mono">Ingresos</p>
          <p className="text-2xl font-bold text-success font-mono">${kpis.ingresosTotales.toFixed(0)}</p>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <TrendingUp className="w-5 h-5 text-primary mb-2" />
          <p className="text-xs text-neutral-content/60 uppercase font-mono">Utilidad</p>
          <p className="text-2xl font-bold text-primary font-mono">${kpis.utilidadTotal.toFixed(0)}</p>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <Users className="w-5 h-5 text-info mb-2" />
          <p className="text-xs text-neutral-content/60 uppercase font-mono">Clientes</p>
          <p className="text-2xl font-bold text-white font-mono">{kpis.totalClientes}</p>
          <p className="text-xs text-success mt-1">{kpis.totalSuscriptores} suscritos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl md:col-span-2">
          <h3 className="font-bold text-white mb-6">Ingresos vs Utilidad Real</h3>
          <div className="h-72">
            {dataRevenueFormatted.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataRevenueFormatted} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="name" stroke="#ffffff80" />
                  <YAxis stroke="#ffffff80" />
                  <RechartsTooltip cursor={{fill: '#ffffff10'}} contentStyle={{ backgroundColor: '#0B0F19', border: '1px solid #00E5FF' }} />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos ($)" fill="#00E5FF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="utilidad" name="Utilidad ($)" fill="#9DFF00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-content/50">
                No hay datos de ventas aún.
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl">
          <h3 className="font-bold text-white mb-6">Adopción de Planes</h3>
          <div className="h-72">
            {dataPlans.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPlans}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {dataPlans.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0B0F19', border: 'none', borderRadius: '8px' }} itemStyle={{color: '#fff'}} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-content/50">
                Sin datos de planes.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl">
        <h3 className="font-bold text-white mb-6">Stock por Producto</h3>
        <div className="h-60">
          {dataStock.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart2 data={dataStock} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis type="number" stroke="#ffffff80" />
                <YAxis type="category" dataKey="name" stroke="#ffffff80" width={70} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0B0F19', border: '1px solid #FF0055' }} />
                <Bar dataKey="stock" name="Unidades" fill="#FF0055" radius={[0, 4, 4, 0]} />
              </BarChart2>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-content/50">
              Sin productos en inventario.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
