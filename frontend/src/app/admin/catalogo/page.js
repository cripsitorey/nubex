'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, ChevronDown, ChevronUp, Edit, Package } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';

function ModalModelo({ modelo, onClose, onSave }) {
  const [form, setForm] = useState(modelo || { nombre: '', marca: '', descripcion: '', puffs: '', costo: '', precioVendedor: '', precioSugerido: '', mostrarPrecio: true });
  const [imagen, setImagen] = useState(null);
  const [saving, setSaving] = useState(false);
  useEscapeKey(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      ['nombre', 'marca', 'descripcion', 'puffs', 'costo', 'precioVendedor', 'precioSugerido', 'mostrarPrecio'].forEach((k) => fd.append(k, form[k] ?? ''));
      if (imagen) fd.append('imagen', imagen);

      if (modelo) await api.patch(`/vapes/${modelo.id}`, fd);
      else await api.post('/vapes', fd);
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
        <h3 className="font-bold text-lg mb-4">{modelo ? 'Editar modelo' : 'Nuevo modelo'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          {[['nombre', 'Nombre'], ['marca', 'Marca'], ['descripcion', 'Descripción']].map(([k, l]) => (
            <div key={k} className="form-control">
              <label className="label"><span className="label-text">{l}</span></label>
              <input className="input input-bordered input-sm" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[['puffs', 'Puffs'], ['costo', 'Costo ($)'], ['precioVendedor', 'Precio vendedor ($)'], ['precioSugerido', 'Precio público ($)']].map(([k, l]) => (
              <div key={k} className="form-control">
                <label className="label"><span className="label-text text-xs">{l}</span></label>
                <input type="number" step="0.01" className="input input-bordered input-sm" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required />
              </div>
            ))}
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Imagen por defecto</span></label>
            <input type="file" accept="image/*" className="file-input file-input-bordered file-input-sm" onChange={(e) => setImagen(e.target.files[0])} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={!!form.mostrarPrecio} onChange={(e) => setForm({ ...form, mostrarPrecio: e.target.checked })} />
            <span className="text-sm">Mostrar precio en catálogo</span>
          </label>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? <span className="loading loading-spinner loading-xs" /> : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function ModalVariante({ modeloId, variante, onClose, onSave }) {
  const [sabor, setSabor] = useState(variante?.sabor || '');
  const [stock, setStock] = useState(variante?.stock || 0);
  const [imagen, setImagen] = useState(null);
  const [saving, setSaving] = useState(false);
  useEscapeKey(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('sabor', sabor);
      fd.append('stock', stock);
      if (imagen) fd.append('imagen', imagen);

      if (variante) await api.patch(`/vapes/${modeloId}/variantes/${variante.id}`, fd);
      else await api.post(`/vapes/${modeloId}/variantes`, fd);
      onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-sm">
        <h3 className="font-bold text-lg mb-4">{variante ? 'Editar sabor' : 'Nuevo sabor'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Sabor</span></label>
            <input className="input input-bordered input-sm" value={sabor} onChange={(e) => setSabor(e.target.value)} required />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Stock inicial</span></label>
            <input type="number" className="input input-bordered input-sm" value={stock} onChange={(e) => setStock(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Imagen</span></label>
            <input type="file" accept="image/*" className="file-input file-input-bordered file-input-sm" onChange={(e) => setImagen(e.target.files[0])} />
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

export default function CatalogoPage() {
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState({});
  const [modalModelo, setModalModelo] = useState(null); // null | {} | modelo
  const [modalVariante, setModalVariante] = useState(null);

  const load = () => {
    api.get('/vapes?soloActivos=false').then(setModelos).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleExpand = (id) => setExpandido((prev) => ({ ...prev, [id]: !prev[id] }));

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Catálogo</h2>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setModalModelo({})}>
          <Plus size={16} /> Nuevo modelo
        </button>
      </div>

      <div className="space-y-3">
        {modelos.map((m) => (
          <div key={m.id} className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{m.nombre}</h3>
                    <span className="badge badge-ghost badge-sm">{m.marca}</span>
                    {!m.activo && <span className="badge badge-error badge-sm">Inactivo</span>}
                  </div>
                  <p className="text-sm text-base-content/60">{m.puffs} puffs · Costo ${m.costo} · Vendedor ${m.precioVendedor} · Público ${m.precioSugerido}</p>
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-ghost btn-xs" onClick={() => setModalModelo(m)}><Edit size={14} /></button>
                  <button className="btn btn-ghost btn-xs" onClick={() => toggleExpand(m.id)}>
                    {expandido[m.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {expandido[m.id] && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Sabores ({m.variantes?.length || 0})</span>
                    <button className="btn btn-ghost btn-xs gap-1" onClick={() => setModalVariante({ modeloId: m.id })}>
                      <Plus size={12} /> Agregar sabor
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {m.variantes?.map((v) => (
                      <div key={v.id} className="flex items-center gap-2 p-2 rounded-lg bg-base-200">
                        {v.imagenUrl ? (
                          <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'}${v.imagenUrl}`} className="w-10 h-10 rounded object-cover" alt={v.sabor} />
                        ) : (
                          <div className="w-10 h-10 rounded bg-base-300 flex items-center justify-center"><Package size={16} /></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{v.sabor}</p>
                          <p className="text-xs text-base-content/60">Stock: {v.stock}</p>
                        </div>
                        <button className="btn btn-ghost btn-xs" onClick={() => setModalVariante({ modeloId: m.id, variante: v })}>
                          <Edit size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {modalModelo !== null && (
        <ModalModelo
          modelo={modalModelo.id ? modalModelo : null}
          onClose={() => setModalModelo(null)}
          onSave={() => { setModalModelo(null); load(); }}
        />
      )}

      {modalVariante && (
        <ModalVariante
          modeloId={modalVariante.modeloId}
          variante={modalVariante.variante}
          onClose={() => setModalVariante(null)}
          onSave={() => { setModalVariante(null); load(); }}
        />
      )}
    </div>
  );
}
