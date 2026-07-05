'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function MiInventario() {
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/inventario').then(setInventario).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg" /></div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Mi inventario</h2>
      {inventario.length === 0 ? (
        <div className="text-center py-10 text-base-content/50">No tienes productos asignados aún.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {inventario.map((item) => (
            <div key={item.id} className={`card bg-base-100 shadow-sm ${item.cantidad === 0 ? 'opacity-50' : ''}`}>
              <div className="card-body p-4 text-center">
                {item.variante?.imagenUrl ? (
                  <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'}${item.variante.imagenUrl}`}
                    className="w-16 h-16 rounded object-cover mx-auto" alt={item.variante.sabor} />
                ) : (
                  <div className="w-16 h-16 rounded bg-base-200 mx-auto" />
                )}
                <p className="font-bold text-sm mt-2">{item.variante?.modelo?.nombre}</p>
                <p className="text-xs text-base-content/60">{item.variante?.sabor}</p>
                <p className={`text-2xl font-bold mt-1 ${item.cantidad === 0 ? 'text-error' : 'text-primary'}`}>{item.cantidad}</p>
                <p className="text-xs text-base-content/40">unidades</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
