'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

function ModalVendedor({ vendedor, onClose, onSave }) {
  const [form, setForm] = useState(vendedor || { nombre: '', email: '', telefono: '', cedula: '', password: '', role: 'VENDEDOR' });
  const [comision, setComision] = useState(vendedor?.comisionDefault || { tipo: 'PRECIO_FIJO', valor: '' });
  const [saving, setSaving] = useState(false);
  useEscapeKey(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let id = vendedor?.id;
      if (vendedor) {
        await api.patch(`/users/${id}`, { nombre: form.nombre, email: form.email, telefono: form.telefono, cedula: form.cedula });
      } else {
        const created = await api.post('/users', { ...form, role: 'VENDEDOR' });
        id = created.id;
      }
      if (comision.valor) {
        await api.post('/inventario/comision', { vendedorId: id, tipo: comision.tipo, valor: comision.valor });
      }
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
        <h3 className="font-bold text-lg mb-4">{vendedor ? 'Editar vendedor' : 'Nuevo vendedor'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-control col-span-2">
              <label className="label"><span className="label-text">Nombre *</span></label>
              <input className="input input-bordered input-sm" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </div>
            {[['telefono', 'Teléfono'], ['cedula', 'Cédula'], ['email', 'Email']].map(([k, l]) => (
              <div key={k} className="form-control">
                <label className="label"><span className="label-text text-xs">{l}</span></label>
                <input className="input input-bordered input-sm" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
            {!vendedor && (
              <div className="form-control">
                <label className="label"><span className="label-text text-xs">Contraseña *</span></label>
                <input type="password" className="input input-bordered input-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!vendedor} />
              </div>
            )}
          </div>

          <div className="divider text-xs">Comisión por defecto</div>
          <div className="flex gap-3">
            <select className="select select-bordered select-sm flex-1" value={comision.tipo} onChange={(e) => setComision({ ...comision, tipo: e.target.value })}>
              <option value="PRECIO_FIJO">Precio fijo por unidad</option>
              <option value="PORCENTAJE">Porcentaje del admin</option>
            </select>
            <input type="number" step="0.01" className="input input-bordered input-sm w-32" placeholder={comision.tipo === 'PORCENTAJE' ? '% admin' : '$ fijo'} value={comision.valor} onChange={(e) => setComision({ ...comision, valor: e.target.value })} />
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

export default function VendedoresPage() {
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/users?role=VENDEDOR').then(({ data }) => setVendedores(data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vendedores</h2>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setModal({})}><Plus size={16} /> Nuevo</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendedores.map((v) => (
            <div key={v.id} className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold">{v.nombre}</h3>
                    <p className="text-sm text-base-content/60">{v.telefono}</p>
                    <p className="text-xs text-base-content/40">{v.email}</p>
                  </div>
                  <button className="btn btn-ghost btn-sm btn-square" onClick={() => setModal(v)}><Edit size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <ModalVendedor
          vendedor={modal.id ? modal : null}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
