"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, ArrowRightLeft, Plus, Loader2, AlertCircle } from "lucide-react";
import { getVapes, createVape, getUsers, assignInventory } from "@/services/api";

export default function StockCentral() {
  const [stock, setStock] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignModal, setAssignModal] = useState(null);
  const [assignData, setAssignData] = useState({ vendedorId: "", cantidad: 1 });
  const [submitting, setSubmitting] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ nombre: "", descripcion: "", costo: "", precio: "", stockGlobal: "", imagen: null });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [vapesData, usersData] = await Promise.all([getVapes(), getUsers()]);
      setStock(Array.isArray(vapesData) ? vapesData : vapesData.data || []);
      const users = Array.isArray(usersData) ? usersData : usersData.data || [];
      setVendedores(users.filter(u => u.role === "VENDEDOR"));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await assignInventory(parseInt(assignData.vendedorId), assignModal.id, parseInt(assignData.cantidad));
      setAssignModal(null);
      setAssignData({ vendedorId: "", cantidad: 1 });
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("nombre", newProduct.nombre);
      fd.append("descripcion", newProduct.descripcion);
      fd.append("costo", newProduct.costo);
      fd.append("precio", newProduct.precio);
      fd.append("stockGlobal", newProduct.stockGlobal);
      if (newProduct.imagen) fd.append("imagen", newProduct.imagen);
      await createVape(fd);
      setShowNewProduct(false);
      setNewProduct({ nombre: "", descripcion: "", costo: "", precio: "", stockGlobal: "", imagen: null });
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> Inventario Central
        </h2>
        <button onClick={() => setShowNewProduct(true)} className="btn btn-primary btn-sm rounded-xl font-bold shadow-[0_0_15px_rgba(0,229,255,0.4)]">
          <Plus className="w-4 h-4 mr-1" /> Nuevo Producto
        </button>
      </div>

      {showNewProduct && (
        <div className="glass-card p-6 rounded-3xl animate-in fade-in zoom-in duration-300 border border-primary/30">
          <h3 className="font-bold text-white mb-4">Crear Producto</h3>
          <form onSubmit={handleNewProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Nombre</label>
              <input type="text" required value={newProduct.nombre} onChange={e => setNewProduct({...newProduct, nombre: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Descripción</label>
              <input type="text" value={newProduct.descripcion} onChange={e => setNewProduct({...newProduct, descripcion: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Costo ($)</label>
              <input type="number" step="0.01" required value={newProduct.costo} onChange={e => setNewProduct({...newProduct, costo: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Precio ($)</label>
              <input type="number" step="0.01" required value={newProduct.precio} onChange={e => setNewProduct({...newProduct, precio: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Stock Global</label>
              <input type="number" required value={newProduct.stockGlobal} onChange={e => setNewProduct({...newProduct, stockGlobal: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Imagen</label>
              <input type="file" accept="image/*" onChange={e => setNewProduct({...newProduct, imagen: e.target.files[0]})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 file:mr-2 file:bg-primary file:text-primary-content file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-bold" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowNewProduct(false)} className="btn btn-ghost text-neutral-content hover:bg-white/10">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-primary shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {assignModal && (
        <div className="glass-card p-6 rounded-3xl animate-in fade-in zoom-in duration-300 border border-info/30">
          <h3 className="font-bold text-white mb-4">Asignar &quot;{assignModal.nombre}&quot; a Vendedor</h3>
          <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Vendedor</label>
              <select required value={assignData.vendedorId} onChange={e => setAssignData({...assignData, vendedorId: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none">
                <option value="">Selecciona...</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Cantidad</label>
              <input type="number" min="1" max={assignModal.stockGlobal} required value={assignData.cantidad} onChange={e => setAssignData({...assignData, cantidad: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setAssignModal(null)} className="btn btn-ghost text-neutral-content hover:bg-white/10">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-info shadow-[0_0_15px_rgba(0,200,255,0.3)]">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Asignar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto glass-card rounded-3xl">
        <table className="table w-full text-left">
          <thead className="text-neutral-content/60 font-mono text-xs uppercase border-b border-white/10">
            <tr>
              <th className="p-4">Producto</th>
              <th className="p-4">Stock Bodega</th>
              <th className="p-4">Costo ($)</th>
              <th className="p-4">Precio ($)</th>
              <th className="p-4 text-right">Traslados</th>
            </tr>
          </thead>
          <tbody>
            {stock.map(item => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-bold text-white">{item.nombre}</td>
                <td className="p-4">
                  <span className={`font-mono font-bold ${item.stockGlobal < 50 ? 'text-warning' : 'text-success'}`}>
                    {item.stockGlobal} unds
                  </span>
                </td>
                <td className="p-4 font-mono">${parseFloat(item.costo).toFixed(2)}</td>
                <td className="p-4 font-mono text-primary">${parseFloat(item.precio).toFixed(2)}</td>
                <td className="p-4 flex justify-end gap-2">
                  <button onClick={() => setAssignModal(item)} className="btn btn-xs btn-outline btn-info">
                    <ArrowRightLeft className="w-3 h-3 mr-1" /> Asignar a Vendedor
                  </button>
                </td>
              </tr>
            ))}
            {stock.length === 0 && (
              <tr><td colSpan="5" className="p-8 text-center text-neutral-content/50">No hay productos en inventario.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
