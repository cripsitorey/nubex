"use client";

import React, { useState, useEffect, useCallback, Fragment } from "react";
import { Package, ArrowRightLeft, Plus, Loader2, AlertCircle, ChevronDown, ChevronUp, Edit2, Trash2 } from "lucide-react";
import { getInventory, createVape, getUsers, assignInventory, updateVape, deleteVape, updateAssignedInventory, removeAssignedInventory } from "@/services/api";

export default function StockCentral() {
  const [stock, setStock] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modals
  const [assignModal, setAssignModal] = useState(null);
  const [assignData, setAssignData] = useState({ vendedorId: "", cantidad: 1 });
  
  const [editVapeModal, setEditVapeModal] = useState(null);
  const [editVapeData, setEditVapeData] = useState({ nombre: "", descripcion: "", costo: "", precio: "", stockGlobal: "", media: [], mostrarPrecio: true });

  const [editAssignModal, setEditAssignModal] = useState(null);
  const [editAssignData, setEditAssignData] = useState({ cantidad: "" });

  const [submitting, setSubmitting] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ nombre: "", descripcion: "", costo: "", precio: "", stockGlobal: "", media: [], mostrarPrecio: true });
  
  const [expandedRows, setExpandedRows] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [vapesData, usersData] = await Promise.all([getInventory(), getUsers()]);
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

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
      fd.append("mostrarPrecio", newProduct.mostrarPrecio);
      
      if (newProduct.media && newProduct.media.length > 0) {
        for (let i = 0; i < newProduct.media.length; i++) {
          fd.append("media", newProduct.media[i]);
        }
      }

      await createVape(fd);
      setShowNewProduct(false);
      setNewProduct({ nombre: "", descripcion: "", costo: "", precio: "", stockGlobal: "", media: [], mostrarPrecio: true });
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVape = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("nombre", editVapeData.nombre);
      fd.append("descripcion", editVapeData.descripcion);
      fd.append("costo", editVapeData.costo);
      fd.append("precio", editVapeData.precio);
      fd.append("stockGlobal", editVapeData.stockGlobal);
      fd.append("mostrarPrecio", editVapeData.mostrarPrecio);

      if (editVapeData.media && editVapeData.media.length > 0) {
        for (let i = 0; i < editVapeData.media.length; i++) {
          fd.append("media", editVapeData.media[i]);
        }
      }

      await updateVape(editVapeModal.id, fd);
      setEditVapeModal(null);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVape = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este producto? Se eliminará del inventario y bodega.")) return;
    try {
      await deleteVape(id);
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditAssign = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await updateAssignedInventory(editAssignModal.id, parseInt(editAssignData.cantidad));
      setEditAssignModal(null);
      await fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssign = async (id) => {
    if (!confirm("¿Eliminar asignación y regresar vapes a la bodega?")) return;
    try {
      await removeAssignedInventory(id);
      await fetchData();
    } catch (err) {
      setError(err.message);
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

      {/* MODAL NUEVO PRODUCTO */}
      {showNewProduct && (
        <div className="glass-card p-6 rounded-3xl animate-in fade-in zoom-in duration-300 border border-primary/30 mb-6">
          <h3 className="font-bold text-white mb-4">Crear Producto</h3>
          <form onSubmit={handleNewProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Nombre</label>
              <input type="text" required value={newProduct.nombre} onChange={e => setNewProduct({...newProduct, nombre: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Descripción</label>
              <input type="text" value={newProduct.descripcion} onChange={e => setNewProduct({...newProduct, descripcion: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Costo ($)</label>
              <input type="number" step="0.01" required value={newProduct.costo} onChange={e => setNewProduct({...newProduct, costo: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Precio ($)</label>
              <input type="number" step="0.01" required value={newProduct.precio} onChange={e => setNewProduct({...newProduct, precio: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Stock Bodega Inicial</label>
              <input type="number" required value={newProduct.stockGlobal} onChange={e => setNewProduct({...newProduct, stockGlobal: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Imágenes / Videos</label>
              <input type="file" multiple accept="image/*,video/*" onChange={e => setNewProduct({...newProduct, media: Array.from(e.target.files)})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 file:mr-2 file:bg-primary file:text-primary-content file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-bold" />
              {newProduct.media.length > 0 && (
                <p className="text-xs text-success mt-1">{newProduct.media.length} archivos seleccionados</p>
              )}
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={newProduct.mostrarPrecio} onChange={e => setNewProduct({...newProduct, mostrarPrecio: e.target.checked})} className="sr-only peer" />
                <div className="w-11 h-6 bg-base-300 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
              <span className="text-sm text-neutral-content/80">Mostrar precio en la tienda</span>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowNewProduct(false)} className="btn btn-ghost text-neutral-content">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EDITAR PRODUCTO */}
      {editVapeModal && (
        <div className="glass-card p-6 rounded-3xl animate-in fade-in zoom-in duration-300 border border-warning/30 mb-6">
          <h3 className="font-bold text-white mb-4">Editar Producto</h3>
          <form onSubmit={handleEditVape} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Nombre</label>
              <input type="text" required value={editVapeData.nombre} onChange={e => setEditVapeData({...editVapeData, nombre: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Descripción</label>
              <input type="text" value={editVapeData.descripcion} onChange={e => setEditVapeData({...editVapeData, descripcion: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Costo ($)</label>
              <input type="number" step="0.01" required value={editVapeData.costo} onChange={e => setEditVapeData({...editVapeData, costo: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Precio ($)</label>
              <input type="number" step="0.01" required value={editVapeData.precio} onChange={e => setEditVapeData({...editVapeData, precio: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Stock Bodega</label>
              <input type="number" required value={editVapeData.stockGlobal} onChange={e => setEditVapeData({...editVapeData, stockGlobal: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1" />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Reemplazar Imágenes / Videos</label>
              <input type="file" multiple accept="image/*,video/*" onChange={e => setEditVapeData({...editVapeData, media: Array.from(e.target.files)})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 file:mr-2 file:bg-primary file:text-primary-content file:border-0 file:rounded-lg file:px-3 file:py-1 file:text-xs file:font-bold" />
              {editVapeData.media.length > 0 && (
                <p className="text-xs text-warning mt-1">{editVapeData.media.length} archivos nuevos (Reemplazarán los actuales)</p>
              )}
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={editVapeData.mostrarPrecio} onChange={e => setEditVapeData({...editVapeData, mostrarPrecio: e.target.checked})} className="sr-only peer" />
                <div className="w-11 h-6 bg-base-300 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
              <span className="text-sm text-neutral-content/80">Mostrar precio en la tienda</span>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setEditVapeModal(null)} className="btn btn-ghost text-neutral-content">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-warning">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL ASIGNAR VENDEDOR */}
      {assignModal && (
        <div className="glass-card p-6 rounded-3xl animate-in fade-in zoom-in duration-300 border border-info/30 mb-6">
          <h3 className="font-bold text-white mb-4">Asignar "{assignModal.nombre}" a Vendedor</h3>
          <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Vendedor</label>
              <select required value={assignData.vendedorId} onChange={e => setAssignData({...assignData, vendedorId: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1">
                <option value="">Selecciona...</option>
                {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Cantidad a asignar</label>
              <input type="number" min="1" max={assignModal.stockGlobal} required value={assignData.cantidad} onChange={e => setAssignData({...assignData, cantidad: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1" />
              <p className="text-xs text-neutral-content mt-1">Disponible en bodega: {assignModal.stockGlobal}</p>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setAssignModal(null)} className="btn btn-ghost text-neutral-content">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-info">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Asignar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL EDITAR ASIGNACION */}
      {editAssignModal && (
        <div className="glass-card p-6 rounded-3xl animate-in fade-in zoom-in duration-300 border border-info/30 mb-6">
          <h3 className="font-bold text-white mb-4">Editar Asignación de {editAssignModal.vendedorNombre}</h3>
          <form onSubmit={handleEditAssign} className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Nueva Cantidad Exacta</label>
              <input type="number" min="0" required value={editAssignData.cantidad} onChange={e => setEditAssignData({cantidad: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1" />
              <p className="text-xs text-neutral-content mt-1">Si aumentas el número, se sacará de bodega. Si disminuyes, regresará a bodega.</p>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setEditAssignModal(null)} className="btn btn-ghost text-neutral-content">Cancelar</button>
              <button type="submit" disabled={submitting} className="btn btn-info">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualizar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLA PRINCIPAL */}
      <div className="overflow-x-auto glass-card rounded-3xl">
        <table className="table w-full text-left">
          <thead className="text-neutral-content/60 font-mono text-xs uppercase border-b border-white/10">
            <tr>
              <th className="p-4 w-10"></th>
              <th className="p-4">Producto</th>
              <th className="p-4 text-center">Bodega</th>
              <th className="p-4 text-center">Vendedores</th>
              <th className="p-4 text-center">Total</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {stock.map(item => {
              const stockVendedores = item.inventarios ? item.inventarios.reduce((sum, inv) => sum + inv.cantidad, 0) : 0;
              const total = item.stockGlobal + stockVendedores;
              const isExpanded = expandedRows[item.id];

              return (
                <Fragment key={item.id}>
                  <tr className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <button onClick={() => toggleRow(item.id)} className="p-1 rounded-md hover:bg-white/10">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-neutral-content" />}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{item.nombre}</div>
                      <div className="text-xs text-neutral-content/60">${parseFloat(item.precio).toFixed(2)} c/u</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`font-mono font-bold ${item.stockGlobal < 10 ? 'text-warning' : 'text-success'}`}>
                        {item.stockGlobal}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-mono font-bold text-info">{stockVendedores}</span>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-white">{total}</td>
                    <td className="p-4 flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setAssignModal(item)} className="btn btn-xs btn-outline btn-info" title="Asignar a Vendedor">
                        <ArrowRightLeft className="w-3 h-3" />
                      </button>
                      <button onClick={() => {
                        setEditVapeData({ nombre: item.nombre, descripcion: item.descripcion || "", costo: item.costo, precio: item.precio, stockGlobal: item.stockGlobal, media: [], mostrarPrecio: item.mostrarPrecio !== false });
                        setEditVapeModal(item);
                      }} className="btn btn-xs btn-outline btn-warning" title="Editar Vape">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDeleteVape(item.id)} className="btn btn-xs btn-outline btn-error" title="Eliminar Vape">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                  
                  {/* FILA EXPANDIDA - DETALLE DE VENDEDORES */}
                  {isExpanded && item.inventarios && item.inventarios.length > 0 && (
                    <tr className="bg-black/20 border-b border-white/5">
                      <td colSpan="6" className="p-4 pl-14">
                        <div className="text-xs uppercase font-mono text-neutral-content/50 mb-2">Asignaciones de este producto:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {item.inventarios.map(inv => (
                            <div key={inv.id} className="bg-base-300 rounded-xl p-3 flex justify-between items-center border border-white/5">
                              <div>
                                <span className="font-bold text-white text-sm">{inv.vendedor.nombre}</span>
                                <div className="text-info font-mono text-xs">{inv.cantidad} unidades</div>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => {
                                  setEditAssignData({ cantidad: inv.cantidad });
                                  setEditAssignModal({ id: inv.id, vendedorNombre: inv.vendedor.nombre });
                                }} className="p-2 hover:bg-white/10 rounded-lg text-warning transition-colors">
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleDeleteAssign(inv.id)} className="p-2 hover:bg-error/20 rounded-lg text-error transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {isExpanded && (!item.inventarios || item.inventarios.length === 0) && (
                    <tr className="bg-black/20 border-b border-white/5">
                      <td colSpan="6" className="p-4 pl-14 text-sm text-neutral-content/60">
                        Ningún vendedor tiene asignado este producto.
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {stock.length === 0 && (
              <tr><td colSpan="6" className="p-8 text-center text-neutral-content/50">No hay productos en inventario.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
