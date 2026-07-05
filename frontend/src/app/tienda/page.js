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

function Lightbox({ src, title, subtitle, onClose }) {
  useEscapeKey(onClose);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          className="btn btn-circle btn-sm absolute -top-3 -right-3 z-10"
          onClick={onClose}
          title="Cerrar"
        >
          <X size={16} />
        </button>
        <div className="bg-base-100 rounded-box overflow-hidden shadow-2xl">
          <VapeImage src={src} alt={title} className="w-full aspect-square object-cover" />
          <div className="p-4 text-center">
            <h3 className="font-bold text-lg">{title}</h3>
            {subtitle && <p className="text-sm text-base-content/60">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TiendaPage() {
  const [modelos, setModelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modelos.map((m) => (
            <div
              key={m.id}
              className="card bg-base-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setLightbox({ src: m.imagenUrl, title: m.nombre, subtitle: m.marca })}
            >
              <VapeImage src={m.imagenUrl} alt={m.nombre} className="w-full aspect-video object-cover rounded-t-box" />
              <div className="card-body p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="card-title text-base">{m.nombre}</h2>
                    <p className="text-xs text-base-content/50">{m.marca} · {m.puffs} puffs</p>
                  </div>
                  {m.mostrarPrecio && <span className="text-lg font-bold text-primary">${m.precioSugerido}</span>}
                </div>
                {m.descripcion && <p className="text-sm text-base-content/70 mt-1">{m.descripcion}</p>}

                {m.variantes?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-base-content/60 mb-2">Sabores disponibles</p>
                    <div className="flex flex-wrap gap-2">
                      {m.variantes.map((v) => (
                        <button
                          key={v.id}
                          className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightbox({ src: v.imagenUrl || m.imagenUrl, title: v.sabor, subtitle: m.nombre });
                          }}
                        >
                          <VapeImage src={v.imagenUrl || m.imagenUrl} alt={v.sabor} className="w-8 h-8 rounded object-cover" />
                          <span className="text-xs">{v.sabor}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          title={lightbox.title}
          subtitle={lightbox.subtitle}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
