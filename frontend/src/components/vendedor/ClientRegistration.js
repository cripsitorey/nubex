"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, Wifi, WifiOff, Users, Edit2, Trash2, Loader2, Search } from "lucide-react";
import { getCachedCatalog, addToSyncQueue } from "@/lib/syncService";
import { registerUser, getUsers, updateUser, deleteUser } from "@/services/api";
import { useNetwork } from "@/components/NetworkProvider";
import { useAuth } from "@/hooks/useAuth";
import { getPlans } from "@/services/api";

export default function ClientRegistration({ onRegistered, standalone = false }) {
  const { isOnline } = useNetwork();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    cedula: "",
    password: "",
    planId: ""
  });
  
  const [clientes, setClientes] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [editModal, setEditModal] = useState(null);
  const [editData, setEditData] = useState({ nombre: "", email: "", telefono: "", cedula: "", planId: "", newPassword: "" });
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";

  const loadData = useCallback(async () => {
    try {
      setLoadingClientes(true);
      const catalog = await getCachedCatalog();
      if (catalog && catalog.planes) {
        setPlanes(catalog.planes);
      } else {
        // Fallback: cargar planes directamente
        try {
          const fetchedPlans = await getPlans();
          setPlanes(Array.isArray(fetchedPlans) ? fetchedPlans : []);
        } catch { /* ignore */ }
      }
      
      if (isOnline) {
        const usersRes = await getUsers();
        const data = Array.isArray(usersRes) ? usersRes : usersRes.data || [];
        setClientes(data.filter(u => u.role === "CLIENTE"));
      }
    } catch (err) {
      console.warn("No se pudieron cargar los clientes", err);
    } finally {
      setLoadingClientes(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    if (isOnline) {
      try {
        const userData = {
          nombre: formData.nombre,
          password: formData.password || formData.cedula,
          cedula: formData.cedula,
          telefono: formData.telefono,
          email: formData.email || undefined,
          conSuscripcion: formData.planId !== ""
        };

        const newUser = await registerUser(userData);
        
        setIsSubmitting(false);
        if (standalone) {
          setSuccess("Cliente registrado exitosamente.");
          setFormData({ nombre: "", email: "", telefono: "", cedula: "", password: "", planId: "" });
          loadData();
        } else if (onRegistered) {
          onRegistered({
            id: newUser.id,
            nombre: newUser.nombre,
            suscripcion: null,
            asignarSuscripcion: formData.planId !== "",
          });
        }
        return;
      } catch (err) {
        console.warn("Registro online falló, encolando offline:", err.message);
        setError("");
      }
    }

    const tempId = -Math.floor(Math.random() * 1000000);
    const payload = {
      ...formData,
      password: formData.password || formData.cedula,
      tempId,
      asignarSuscripcion: formData.planId !== ""
    };

    await addToSyncQueue("USER_CREATION", payload);
    
    setIsSubmitting(false);
    if (standalone) {
      setSuccess("Cliente encolado offline exitosamente.");
      setFormData({ nombre: "", email: "", telefono: "", cedula: "", password: "", planId: "" });
    } else if (onRegistered) {
      onRegistered({ id: tempId, ...payload });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!isOnline) {
      alert("Necesitas conexión a internet para editar clientes.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await updateUser(editModal.id, {
        nombre: editData.nombre,
        telefono: editData.telefono,
        email: editData.email,
        role: "CLIENTE",
        ...(editData.newPassword ? { password: editData.newPassword } : {}),
        conSuscripcion: editData.planId !== "",
        planId: editData.planId ? parseInt(editData.planId) : undefined
      });
      setSuccess("Cliente actualizado exitosamente.");
      setEditModal(null);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isOnline) {
      alert("Necesitas conexión a internet para eliminar clientes.");
      return;
    }
    if (!confirm("¿Eliminar este cliente? No se podrá si ya tiene compras registradas.")) return;
    
    try {
      await deleteUser(id);
      setSuccess("Cliente eliminado.");
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.cedula && c.cedula.includes(searchTerm)) ||
    (c.telefono && c.telefono.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-white">Nuevo Cliente</h3>
          <div className="ml-auto">
            {isOnline
              ? <Wifi className="w-4 h-4 text-success" />
              : <WifiOff className="w-4 h-4 text-warning" />
            }
          </div>
        </div>

        {error && (
          <div className="bg-error/20 text-error p-3 rounded-xl text-sm border border-error/30 text-center mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-success/20 text-success p-3 rounded-xl text-sm border border-success/30 text-center mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-content/60 uppercase font-mono">Nombre Completo</label>
            <input type="text" name="nombre" required className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" value={formData.nombre} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Teléfono</label>
              <input type="tel" name="telefono" required className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" value={formData.telefono} onChange={handleChange} />
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Cédula</label>
              <input type="text" name="cedula" className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" value={formData.cedula} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-content/60 uppercase font-mono">Email (Opcional)</label>
            <input type="email" name="email" className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none" value={formData.email} onChange={handleChange} />
          </div>

          <div>
            <label className="text-xs text-neutral-content/60 uppercase font-mono">Contraseña</label>
            <input type="password" name="password" placeholder="Por defecto: la cédula" className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none placeholder:text-neutral-content/30" value={formData.password} onChange={handleChange} />
          </div>

          <div>
            <label className="text-xs text-neutral-content/60 uppercase font-mono">Plan de Suscripción</label>
            <select name="planId" className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-primary outline-none appearance-none" value={formData.planId} onChange={handleChange}>
              <option value="">Cliente Casual (Sin Plan)</option>
              {planes.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.nombre} - Cada {plan.diasEntreEntregas} días
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-content font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-shadow mt-4"
          >
            {isSubmitting ? "Registrando..." : (isOnline ? "Registrar Cliente" : "Registrar Offline")}
          </button>
        </form>
      </div>

      {/* MODAL EDICION */}
      {editModal && (
        <div className="glass-card p-6 rounded-3xl animate-in fade-in zoom-in duration-300 border border-warning/30">
          <h3 className="font-bold text-white mb-4">Editar Cliente</h3>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Nombre</label>
              <input type="text" required value={editData.nombre} onChange={e => setEditData({...editData, nombre: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-warning outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-content/60 uppercase font-mono">Teléfono</label>
                <input type="tel" required value={editData.telefono} onChange={e => setEditData({...editData, telefono: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-warning outline-none" />
              </div>
              <div>
                <label className="text-xs text-neutral-content/60 uppercase font-mono">Cédula</label>
                <input type="text" required value={editData.cedula} onChange={e => setEditData({...editData, cedula: e.target.value})} className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-warning outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-content/60 uppercase font-mono">Plan de Suscripción</label>
              <select className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-warning outline-none appearance-none" value={editData.planId} onChange={e => setEditData({...editData, planId: e.target.value})}>
                <option value="">Cliente Casual (Sin Plan)</option>
                {planes.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre} - Cada {plan.diasEntreEntregas} días
                  </option>
                ))}
              </select>
            </div>
            {isAdmin && (
              <div>
                <label className="text-xs text-neutral-content/60 uppercase font-mono">Resetear Contraseña (dejar vacío para no cambiar)</label>
                <input type="password" value={editData.newPassword} onChange={e => setEditData({...editData, newPassword: e.target.value})} placeholder="Nueva contraseña..." className="w-full bg-base-200 border-0 rounded-xl p-3 text-white mt-1 focus:ring-2 focus:ring-warning outline-none placeholder:text-neutral-content/30" />
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setEditModal(null)} className="btn btn-ghost text-neutral-content">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="btn btn-warning shadow-[0_0_15px_rgba(255,170,0,0.3)]">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualizar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA DE CLIENTES */}
      {isOnline && (
        <div className="glass-card p-6 rounded-3xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Clientes Registrados
            </h3>
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-content/50" />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-base-200 border-0 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loadingClientes ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <table className="table w-full text-left">
                <thead className="text-neutral-content/60 font-mono text-xs uppercase border-b border-white/10">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Contacto</th>
                    <th className="p-3 text-center">Suscripción</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map(c => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-3 font-bold text-white text-sm">{c.nombre}</td>
                      <td className="p-3">
                        <div className="text-xs text-neutral-content">{c.telefono}</div>
                        <div className="text-xs font-mono text-neutral-content/60">{c.cedula}</div>
                      </td>
                      <td className="p-3 text-center">
                        {c.suscripcion ? (
                          <span className="bg-success/20 text-success text-xs px-2 py-1 rounded-lg font-bold">Activa</span>
                        ) : (
                          <span className="text-neutral-content/40 text-xs">—</span>
                        )}
                      </td>
                      <td className="p-3 flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {
                          setEditData({ 
                            nombre: c.nombre, 
                            email: c.email || "", 
                            telefono: c.telefono || "", 
                            cedula: c.cedula || "", 
                            planId: c.suscripcion?.planId?.toString() || "",
                            newPassword: ""
                          });
                          setEditModal(c);
                        }} className="p-2 hover:bg-warning/20 rounded-lg text-warning transition-colors" title="Editar">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-error/20 rounded-lg text-error transition-colors" title="Eliminar">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredClientes.length === 0 && (
                    <tr><td colSpan="4" className="p-6 text-center text-neutral-content/50 text-sm">No se encontraron clientes.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
