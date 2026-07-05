'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Minus, ShoppingBag, X } from 'lucide-react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import BuscadorProducto from '@/components/shared/BuscadorProducto';

function ModalAsignar({ onClose, onSave }) {
  const [vendedores, setVendedores] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [varianteSel, setVarianteSel] = useState(null);
  const [form, setForm] = useState({ vendedorId: '', varianteId: '', cantidad: '' });
  const [saving, setSaving] = useState(false);
  useEscapeKey(onClose);

  useEffect(() => {
    api.get('/users?role=VENDEDOR').then(({ data }) => setVendedores(data));
    api.get('/vapes').then((modelos) => {
      const vars = modelos.flatMap((m) => m.variantes.map((v) => ({ ...v, modeloNombre: m.nombre })));
      setVariantes(vars);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/inventario/asignar', form);
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
        <h3 className="font-bold text-lg mb-4">Asignar stock a vendedor</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Vendedor</span></label>
            <select className="select select-bordered select-sm" value={form.vendedorId} onChange={(e) => setForm({ ...form, vendedorId: e.target.value })} required>
              <option value="">Seleccionar...</option>
              {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Variante</span></label>
            {varianteSel ? (
              <div className="flex items-center gap-2 p-2 bg-base-200 rounded-lg">
                <ShoppingBag size={16} />
                <span className="flex-1 text-sm font-medium">{varianteSel.modeloNombre} – {varianteSel.sabor} (Stock: {varianteSel.stock})</span>
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => { setVarianteSel(null); setForm({ ...form, varianteId: '' }); }}><X size={14} /></button>
              </div>
            ) : (
              <BuscadorProducto
                placeholder="Buscar producto por nombre o sabor..."
                productos={variantes.map((v) => ({
                  id: v.id,
                  label: `${v.modeloNombre} – ${v.sabor}`,
                  sublabel: `Stock: ${v.stock}`,
                  item: v,
                }))}
                onSelect={(p) => { setVarianteSel(p.item); setForm({ ...form, varianteId: p.item.id }); }}
              />
            )}
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Cantidad</span></label>
            <input type="number" min="1" className="input input-bordered input-sm" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} required />
          </div>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? <span className="loading loading-spinner loading-xs" /> : 'Asignar'}</button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

function ModalQuitar({ item, onClose, onSave }) {
  const [cantidad, setCantidad] = useState(item.cantidad);
  const [saving, setSaving] = useState(false);
  useEscapeKey(onClose);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/inventario/devolver', {
        vendedorId: item.vendedorId,
        varianteId: item.variante.id,
        cantidad,
      });
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
        <h3 className="font-bold text-lg mb-4">Quitar stock a {item.vendedor?.nombre}</h3>
        <p className="text-sm text-base-content/60 mb-3">{item.variante?.modelo?.nombre} – {item.variante?.sabor} (tiene {item.cantidad} uds)</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="form-control">
            <label className="label"><span className="label-text">Cantidad a devolver a bodega</span></label>
            <input type="number" min="1" max={item.cantidad} className="input input-bordered input-sm"
              value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
          </div>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? <span className="loading loading-spinner loading-xs" /> : 'Quitar'}</button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export default function InventarioPage() {
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [modalQuitar, setModalQuitar] = useState(null);
  const [filtroVendedor, setFiltroVendedor] = useState('');

  const load = () => {
    setLoading(true);
    const params = filtroVendedor ? `?vendedorId=${filtroVendedor}` : '';
    api.get(`/inventario${params}`).then(setInventario).finally(() => setLoading(false));
  };

  useEffect(load, [filtroVendedor]);

  const agrupado = inventario.reduce((acc, item) => {
    const nombre = item.vendedor?.nombre || 'Sin vendedor';
    if (!acc[nombre]) acc[nombre] = [];
    acc[nombre].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventario</h2>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setModal(true)}><Plus size={16} /> Asignar</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>
      ) : (
        <div className="space-y-4">
          {Object.entries(agrupado).map(([vendedor, items]) => (
            <div key={vendedor} className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h3 className="font-bold text-base">{vendedor}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex flex-col p-2 rounded bg-base-200 text-sm">
                      <span className="font-medium">{item.variante?.modelo?.nombre}</span>
                      <span className="text-xs text-base-content/60">{item.variante?.sabor}</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-primary font-bold">{item.cantidad} uds</span>
                        <button className="btn btn-ghost btn-xs btn-square" title="Quitar stock" onClick={() => setModalQuitar(item)}>
                          <Minus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && <ModalAsignar onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}

      {modalQuitar && (
        <ModalQuitar item={modalQuitar} onClose={() => setModalQuitar(null)} onSave={() => { setModalQuitar(null); load(); }} />
      )}
    </div>
  );
}
