'use client';
import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Search, Plus, Star, Repeat } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

function ModalCliente({ cliente, onClose, onSave }) {
  const [form, setForm] = useState(cliente || { nombre: '', email: '', telefono: '', cedula: '', password: '', role: 'CLIENTE' });
  const [saving, setSaving] = useState(false);
  useEscapeKey(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (cliente) await api.patch(`/users/${cliente.id}`, form);
      else await api.post('/users', form);
      onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{cliente ? 'Editar cliente' : 'Nuevo cliente'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Nombre *</span></label>
            <input className="input input-bordered input-sm" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['telefono', 'Teléfono'], ['cedula', 'Cédula'], ['email', 'Email']].map(([k, l]) => (
              <div key={k} className="form-control">
                <label className="label"><span className="label-text text-xs">{l}</span></label>
                <input className="input input-bordered input-sm" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            {!cliente && (
              <div className="form-control">
                <label className="label"><span className="label-text text-xs">Contraseña *</span></label>
                <input type="password" className="input input-bordered input-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!cliente} />
              </div>
            )}
          </div>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? <span className="loading loading-spinner loading-xs" /> : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ role: 'CLIENTE' });
    if (search) params.set('search', search);
    api.get(`/users?${params}`).then(({ data, total }) => { setClientes(data); setTotal(total); }).finally(() => setLoading(false));
  }, [search]);

  useEffect(load, [load]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clientes <span className="text-base-content/40 text-lg">({total})</span></h2>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setModal({})}><Plus size={16} /> Nuevo</button>
      </div>

      <div className="join">
        <input className="input input-bordered input-sm join-item w-64" placeholder="Buscar por nombre, teléfono, cédula..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-sm join-item"><Search size={16} /></button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm bg-base-100 rounded-box shadow-sm">
            <thead>
              <tr><th>Nombre</th><th>Teléfono</th><th>Cédula</th><th>Email</th><th>Registro</th><th></th></tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="hover cursor-pointer" onClick={() => setModal(c)}>
                  <td className="font-medium">{c.nombre}</td>
                  <td>{c.telefono}</td>
                  <td>{c.cedula}</td>
                  <td>{c.email}</td>
                  <td className="text-xs text-base-content/60">{new Date(c.createdAt).toLocaleDateString('es')}</td>
                  <td>
                    <button className="btn btn-ghost btn-xs" onClick={(e) => { e.stopPropagation(); setModal(c); }}>Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <ModalCliente
          cliente={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
