import {
  getStore,
  putToStore,
  clearStore,
  getPendingQueue,
  getPendingCount,
  removeFromQueue,
  markQueueProcessed,
  markQueueFailed,
  addToQueue,
} from "./db";

export const addToSyncQueue = addToQueue;
export { getPendingCount };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function getAuthHeaders() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("nubex_token")
      : null;
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// ─── CATALOG CACHE ────────────────────────────────────────────────────────────

export async function fetchAndCacheCatalog() {
  try {
    const authHeaders = getAuthHeaders();
    const [vapesRes, planesRes] = await Promise.all([
      fetch(`${API_URL}/vapes`, { headers: authHeaders }),
      fetch(`${API_URL}/subscriptions/plans`, { headers: authHeaders }),
    ]);

    if (!vapesRes.ok || !planesRes.ok) {
      throw new Error("Error fetching catalog from server");
    }

    const vapes = await vapesRes.json();
    const planes = await planesRes.json();

    await clearStore("vapes");
    await clearStore("planes");

    const vapesData = Array.isArray(vapes) ? vapes : vapes.data || [];
    const planesData = Array.isArray(planes) ? planes : planes.data || [];

    for (const vape of vapesData) {
      await putToStore("vapes", vape);
    }
    for (const plan of planesData) {
      await putToStore("planes", plan);
    }

    return { success: true };
  } catch (error) {
    console.error("fetchAndCacheCatalog failed, using local cache", error);
    return { success: false, error };
  }
}

export async function getCachedCatalog() {
  const vapes = await getStore("vapes");
  const planes = await getStore("planes");
  return { vapes, planes };
}

// ─── SYNC QUEUE PROCESSOR ─────────────────────────────────────────────────────

/**
 * Procesa la cola de sincronización pendiente.
 * Retorna un objeto con el resultado de la sincronización:
 * { processed: number, failed: number, total: number, errors: string[] }
 */
export async function processSyncQueue() {
  if (!navigator.onLine) {
    console.log("[Sync] Offline: Sync deferred.");
    return { processed: 0, failed: 0, total: 0, errors: [] };
  }

  const pendingItems = await getPendingQueue();
  if (pendingItems.length === 0) {
    console.log("[Sync] Queue empty.");
    return { processed: 0, failed: 0, total: 0, errors: [] };
  }

  console.log(`[Sync] Processing ${pendingItems.length} pending items...`);

  let processed = 0;
  let failed = 0;
  const errors = [];

  for (const item of pendingItems) {
    try {
      const result = await processSingleItem(item);

      if (result.success) {
        await removeFromQueue(item.id);
        processed++;
        console.log(
          `[Sync] ✅ Item ${item.id} (${item.type}) synced successfully.`
        );
      } else {
        await markQueueFailed(item.id, result.error);
        failed++;
        errors.push(`${item.type} #${item.id}: ${result.error}`);
        console.error(
          `[Sync] ❌ Item ${item.id} failed: ${result.error} (retry ${item.retryCount + 1})`
        );
      }
    } catch (error) {
      // Error de red: detener el procesamiento
      console.error(
        `[Sync] 🔌 Network error on item ${item.id}:`,
        error.message
      );
      errors.push(`Error de red: ${error.message}`);
      failed++;
      break;
    }
  }

  const total = pendingItems.length;
  console.log(
    `[Sync] Complete: ${processed}/${total} synced, ${failed} failed.`
  );

  return { processed, failed, total, errors };
}

/**
 * Procesa un único item de la cola.
 * Retorna { success: boolean, error?: string }
 */
async function processSingleItem(item) {
  let endpoint = "";
  let method = "POST";
  let body;
  let headers = { ...getAuthHeaders() };

  switch (item.type) {
    case "SALE": {
      endpoint = `${API_URL}/sales`;
      body = new FormData();

      // Campos obligatorios
      if (item.payload.clienteId) {
        body.append("clienteId", item.payload.clienteId);
      }
      body.append("vapeId", item.payload.vapeId);
      body.append("cantidad", item.payload.cantidad);
      body.append("precioVenta", item.payload.precioVenta);

      // Campos opcionales
      if (item.payload.costoAdquisicion) {
        body.append("costoAdquisicion", item.payload.costoAdquisicion);
      }
      if (item.payload.pagadoA) {
        body.append("pagadoA", item.payload.pagadoA);
      }

      // Convertir Base64 data URL → Blob → File para multipart/form-data
      if (item.payload.comprobanteBase64) {
        try {
          const dataUrlRes = await fetch(item.payload.comprobanteBase64);
          const blob = await dataUrlRes.blob();
          body.append(
            "comprobante",
            blob,
            `comprobante_offline_${item.id}.jpg`
          );
        } catch (blobErr) {
          console.warn(
            `[Sync] Could not convert comprobante for item ${item.id}:`,
            blobErr.message
          );
          // Enviar sin comprobante en vez de fallar
        }
      }

      // No setear Content-Type para FormData (el browser añade boundary automáticamente)
      break;
    }

    case "USER_CREATION": {
      endpoint = `${API_URL}/auth/register`;
      headers["Content-Type"] = "application/json";

      // Limpiar payload: solo enviar campos que el backend espera
      const { nombre, password, cedula, telefono, email } = item.payload;
      body = JSON.stringify({
        nombre,
        password: password || cedula, // Fallback
        cedula,
        telefono,
        email: email || undefined,
      });
      break;
    }

    default: {
      console.warn(`[Sync] Unknown sync item type: ${item.type}`);
      return { success: false, error: `Tipo desconocido: ${item.type}` };
    }
  }

  const res = await fetch(endpoint, { method, headers, body });

  if (res.ok) {
    return { success: true };
  }

  // Leer error del backend
  let errorMsg = `HTTP ${res.status}`;
  try {
    const errData = await res.json();
    errorMsg = errData.error || errData.message || errorMsg;
  } catch {
    // Si el body no es JSON, usar el status code
  }

  return { success: false, error: errorMsg };
}
