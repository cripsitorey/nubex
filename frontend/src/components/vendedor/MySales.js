"use client";

import { useState, useEffect, useCallback } from "react";
import { Receipt, Loader2, AlertCircle, FileImage, Search } from "lucide-react";
import { getSales } from "@/services/api";

export default function MySales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiptModal, setReceiptModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getSales();
      setSales(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const filteredSales = sales.filter(s => 
    (s.cliente?.nombre && s.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.vape?.nombre && s.vape.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error/20 text-error p-3 rounded-xl text-sm border border-error/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="glass-card p-6 rounded-3xl border border-primary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" /> Mis Ventas
          </h3>
          <p className="text-sm text-neutral-content/60">Has registrado {sales.length} ventas en total</p>
        </div>
        
        <div className="relative w-full md:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-content/50" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, producto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 bg-base-200 border-0 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto glass-card rounded-3xl">
        <table className="table w-full text-left">
          <thead className="text-neutral-content/60 font-mono text-xs uppercase border-b border-white/10">
            <tr>
              <th className="p-4">Fecha</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Producto</th>
              <th className="p-4 text-center">Cant.</th>
              <th className="p-4 text-right">Monto Final</th>
              <th className="p-4 text-center">Estado</th>
              <th className="p-4 text-center">Comprobante</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(s => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-sm text-neutral-content/80 whitespace-nowrap">
                  {new Date(s.createdAt).toLocaleString("es-VE", { 
                    day: '2-digit', month: '2-digit', year: 'numeric', 
                    hour: '2-digit', minute:'2-digit' 
                  })}
                </td>
                <td className="p-4 text-sm font-bold text-white">{s.cliente?.nombre || "Venta Rápida"}</td>
                <td className="p-4 text-sm text-primary">{s.vape?.nombre}</td>
                <td className="p-4 text-center font-mono">{s.cantidad}</td>
                <td className="p-4 text-right font-mono font-bold text-success">
                  ${parseFloat(s.precioVenta).toFixed(2)}
                </td>
                <td className="p-4 text-center">
                  {s.estado === "LIQUIDADA" ? (
                    <span className="bg-success/20 text-success text-xs px-2 py-1 rounded-lg font-bold">Liquidada</span>
                  ) : (
                    <span className="bg-warning/20 text-warning text-xs px-2 py-1 rounded-lg font-bold">Pendiente</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {s.comprobanteUrl ? (
                    <button 
                      onClick={() => setReceiptModal(s.comprobanteUrl)}
                      className="btn btn-xs btn-outline btn-info"
                      title="Ver Comprobante"
                    >
                      <FileImage className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-neutral-content/40 text-xs">Sin Comprobante</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredSales.length === 0 && (
              <tr><td colSpan="7" className="p-8 text-center text-neutral-content/50">Aún no has registrado ninguna venta.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setReceiptModal(null)}>
          <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setReceiptModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-error transition-colors font-bold"
            >
              Cerrar
            </button>
            {receiptModal.endsWith('.mp4') || receiptModal.endsWith('.webm') ? (
              <video src={`http://localhost:5000${receiptModal}`} controls className="w-full h-auto rounded-xl shadow-2xl" autoPlay />
            ) : (
              <img src={`http://localhost:5000${receiptModal}`} alt="Comprobante" className="w-full h-auto object-contain max-h-[85vh] rounded-xl shadow-2xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
