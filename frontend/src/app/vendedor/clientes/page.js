'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { UserCheck } from 'lucide-react';

export default function RegistrarCliente() {
  const [form, setForm] = useState({ nombre: '', telefono: '', cedula: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cliente = await api.post('/users', { ...form, role: 'CLIENTE' });
      setSuccess(cliente);
      setForm({ nombre: '', telefono: '', cedula: '', email: '', password: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Registrar cliente</h2>

      {success && (
        <div className="alert alert-success">
          <UserCheck size={18} />
          <span>Cliente <strong>{success.nombre}</strong> registrado correctamente</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="form-control">
              <label className="label"><span className="label-text">Nombre completo *</span></label>
              <input className="input input-bordered" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label"><span className="label-text text-xs">Teléfono</span></label>
                <input className="input input-bordered input-sm" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs">Cédula</span></label>
                <input className="input input-bordered input-sm" value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} />
              </div>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text text-xs">Email</span></label>
              <input type="email" className="input input-bordered input-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text text-xs">Contraseña *</span></label>
              <input type="password" className="input input-bordered input-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={saving}>
              {saving ? <span className="loading loading-spinner" /> : 'Registrar cliente'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
