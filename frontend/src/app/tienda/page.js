'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Package, X } from 'lucide-react';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';
const url = (path) => `${API_ORIGIN}${path}`;

function VapeImage({ src, alt, className }) {
  if (src) return <img src={url(src)} alt={alt} className={className} />;
  return (
    <div className={`${className} bg-base-200 flex items-center justify-center`}>
      <Package className="text-base-content/30" size={32} />
    </div>
  );
}

function ModalProducto({ modelo, onClose }) {
  const [saborId, setSaborId] = useState(modelo.variantes?.[0]?.id ?? null);
  useEscapeKey(onClose);

  const sabor = modelo.variantes?.find((v) => v.id === saborId);
  const imagen = sabor?.imagenUrl || modelo.imagenUrl;

  return (
    <dialog className="modal modal-open" onClick={onClose}>
      <div className="modal-box max-w-md p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10 bg-base-100/70" onClick={onClose}>
          <X size={16} />
        </button>
        <VapeImage src={imagen} alt={sabor?.sabor || modelo.nombre} className="w-full aspect-square object-cover" />
        <div className="p-4">
          <h3 className="font-bold text-lg">{modelo.nombre}</h3>
          <p className="text-xs text-base-content/50">{modelo.marca} · {modelo.puffs} puffs</p>
          {modelo.mostrarPrecio && <p className="text-xl font-bold text-primary mt-1">${modelo.precioSugerido}</p>}
          {modelo.descripcion && <p className="text-sm text-base-content/70 mt-2">{modelo.descripcion}</p>}

          {modelo.variantes?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-base-content/60 mb-2">
                Sabor{sabor ? `: ${sabor.sabor}` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {modelo.variantes.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`btn btn-xs sm:btn-sm ${saborId === v.id ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setSaborId(v.id)}
                  >
                    {v.sabor}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

export default function TiendaPage() {
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalModelo, setModalModelo] = useState(null);

  useEffect(() => {
    api.get('/vapes/publico').then(setModelos).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>;

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start" />
        <div className="navbar-center">
          <span className="text-2xl font-bold text-primary">Nubex</span>
        </div>
        <div className="navbar-end">
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-2">Nuestro catálogo</h1>
        <p className="text-center text-base-content/60 mb-8">Los mejores vapes, los mejores sabores</p>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {modelos.map((m) => (
            <div
              key={m.id}
              className="card bg-base-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setModalModelo(m)}
            >
              <VapeImage src={m.imagenUrl} alt={m.nombre} className="w-full aspect-square sm:aspect-video object-cover rounded-t-box" />
              <div className="card-body p-3 sm:p-4">
                <h2 className="card-title text-sm sm:text-base">{m.nombre}</h2>
                <p className="text-xs text-base-content/50">{m.marca} · {m.puffs} puffs</p>
                {m.mostrarPrecio && <span className="text-base sm:text-lg font-bold text-primary">${m.precioSugerido}</span>}
                {m.variantes?.length > 0 && (
                  <p className="text-xs text-base-content/50 mt-1">{m.variantes.length} sabor{m.variantes.length === 1 ? '' : 'es'}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalModelo && (
        <ModalProducto modelo={modalModelo} onClose={() => setModalModelo(null)} />
      )}
    </div>
  );
}
