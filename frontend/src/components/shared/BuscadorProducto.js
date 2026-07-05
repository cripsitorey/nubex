'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';

// productos: [{ id, label, sublabel }]
export default function BuscadorProducto({ productos, onSelect, placeholder }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const filtrados = q.length < 1
    ? productos
    : productos.filter((p) => p.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="relative">
      <div className="join w-full">
        <span className="join-item btn btn-sm btn-ghost border border-base-300"><Search size={14} /></span>
        <input
          className="input input-bordered input-sm join-item flex-1"
          placeholder={placeholder || 'Buscar producto...'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && (
        <ul className="absolute z-10 w-full mt-1 bg-base-100 border border-base-200 rounded-box shadow-lg max-h-56 overflow-y-auto">
          {filtrados.length === 0 ? (
            <li className="px-3 py-2 text-sm text-base-content/40">Sin resultados</li>
          ) : filtrados.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-base-200 flex items-center justify-between gap-2 text-sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onSelect(p); setQ(''); setOpen(false); }}
              >
                <span className="font-medium">{p.label}</span>
                {p.sublabel && <span className="text-base-content/50 text-xs whitespace-nowrap">{p.sublabel}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
