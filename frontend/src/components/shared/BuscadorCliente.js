'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Search, User } from 'lucide-react';

export default function BuscadorCliente({ onSelect, placeholder }) {
  const [q, setQ] = useState('');
  const [recientes, setRecientes] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get('/users/search').then(setRecientes).catch(() => {});
  }, []);

  useEffect(() => {
    if (q.length < 2) { setResultados([]); return; }
    const t = setTimeout(() => api.get(`/users/search?q=${q}`).then(setResultados), 300);
    return () => clearTimeout(t);
  }, [q]);

  const mostrandoRecientes = q.length < 2;
  const lista = mostrandoRecientes ? recientes : resultados;

  return (
    <div className="relative">
      <div className="join w-full">
        <span className="join-item btn btn-sm btn-ghost border border-base-300"><Search size={14} /></span>
        <input
          className="input input-bordered input-sm join-item flex-1"
          placeholder={placeholder || 'Buscar cliente por nombre, teléfono...'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && lista.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-base-100 border border-base-200 rounded-box shadow-lg max-h-56 overflow-y-auto">
          {mostrandoRecientes && (
            <li className="px-3 pt-2 pb-1 text-xs text-base-content/40 uppercase tracking-wide">Recientes</li>
          )}
          {lista.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-base-200 flex items-center gap-2 text-sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onSelect(c); setQ(''); setOpen(false); }}
              >
                <User size={14} />
                <span className="font-medium">{c.nombre}</span>
                {c.telefono && <span className="text-base-content/50">{c.telefono}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
