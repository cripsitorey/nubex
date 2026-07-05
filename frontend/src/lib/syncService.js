import { api } from './api';
import { replaceAll, getAll, addToQueue, removeFromQueue, getQueue } from './db';

export async function cacheInventario(items) {
  await replaceAll('inventario', items);
}

export async function getCachedInventario() {
  return getAll('inventario');
}

export async function queueVenta(payload) {
  return addToQueue({ payload });
}

export async function getPendingVentas() {
  return getQueue();
}

export async function getPendingCount() {
  return (await getQueue()).length;
}

function isNetworkError(err) {
  return err instanceof TypeError;
}

// Sube las ventas encoladas una por una. Se detiene apenas detecta que
// seguimos sin red; los rechazos reales del servidor (stock insuficiente,
// validación) se descartan de la cola reportando el motivo, ya que
// reintentarlos indefinidamente no los va a arreglar.
export async function flushVentasQueue({ onSuccess, onServerReject } = {}) {
  const queue = await getQueue();
  let synced = 0;

  for (const item of queue) {
    try {
      const venta = await api.post('/ventas', item.payload);
      await removeFromQueue(item.localId);
      synced += 1;
      onSuccess?.(venta, item);
    } catch (err) {
      if (isNetworkError(err)) break;
      await removeFromQueue(item.localId);
      onServerReject?.(err, item);
    }
  }

  return synced;
}
