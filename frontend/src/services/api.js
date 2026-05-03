// Cliente HTTP base con inyección automática de JWT
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nubex_token");
}

/**
 * Wrapper de fetch que inyecta automáticamente el Bearer token.
 * Para FormData, NO se setea Content-Type (lo maneja el browser con boundary).
 */
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Solo inyectar Content-Type si NO es FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Si el token expiró o es inválido, limpiar sesión
  if (res.status === 401 && endpoint !== "/auth/login") {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nubex_token");
      localStorage.removeItem("nubex_user");
      // Redirigir al login si no estamos ya ahí
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    throw new Error("Sesión expirada. Inicia sesión de nuevo.");
  }

  return res;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function loginUser(identifier, password) {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al iniciar sesión");
  }

  const data = await res.json(); // { token, user }
  // Persistir token y usuario
  localStorage.setItem("nubex_token", data.token);
  localStorage.setItem("nubex_user", JSON.stringify(data.user));
  return data;
}

export async function registerUser(userData) {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error en el registro");
  }
  return res.json();
}

export function logoutUser() {
  localStorage.removeItem("nubex_token");
  localStorage.removeItem("nubex_user");
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("nubex_user");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

// ─── VAPES ────────────────────────────────────────────────────────────────────

export async function getVapes() {
  const res = await apiFetch("/vapes");
  if (!res.ok) throw new Error("Error al obtener catálogo de vapes");
  return res.json();
}

export async function getVapeById(id) {
  const res = await apiFetch(`/vapes/${id}`);
  if (!res.ok) throw new Error("Vape no encontrado");
  return res.json();
}

export async function createVape(formData) {
  // formData es un FormData con campos + imagen
  const res = await apiFetch("/vapes", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al crear vape");
  }
  return res.json();
}

export async function updateVape(id, formData) {
  const res = await apiFetch(`/vapes/${id}`, {
    method: "PUT",
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al actualizar vape");
  }
  return res.json();
}

export async function deleteVape(id) {
  const res = await apiFetch(`/vapes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar vape");
  return true;
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function getUsers() {
  const res = await apiFetch("/users");
  if (!res.ok) throw new Error("Error al obtener usuarios");
  return res.json();
}

export async function createUserByAdmin(userData) {
  const res = await apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al crear usuario");
  }
  return res.json();
}

export async function updateUser(id, userData) {
  const res = await apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al actualizar usuario");
  }
  return res.json();
}

export async function deleteUser(id) {
  const res = await apiFetch(`/users/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al eliminar usuario");
  }
  return res.json();
}

// ─── PLANES ───────────────────────────────────────────────────────────────────

export async function getPlans() {
  const res = await apiFetch("/subscriptions/plans");
  if (!res.ok) throw new Error("Error al obtener planes");
  return res.json();
}

export async function createPlan(planData) {
  const res = await apiFetch("/subscriptions/plans", {
    method: "POST",
    body: JSON.stringify(planData),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al crear plan");
  }
  return res.json();
}

export async function updatePlan(id, planData) {
  const res = await apiFetch(`/subscriptions/plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(planData),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al actualizar plan");
  }
  return res.json();
}

export async function deletePlan(id) {
  const res = await apiFetch(`/subscriptions/plans/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar plan");
  return res.json();
}

// ─── VENTAS ───────────────────────────────────────────────────────────────────

export async function getSales() {
  const res = await apiFetch("/sales");
  if (!res.ok) throw new Error("Error al obtener el historial de ventas");
  return res.json();
}

export async function createSale(saleFormData) {
  // saleFormData: FormData con campos + comprobante
  const res = await apiFetch("/sales", {
    method: "POST",
    body: saleFormData,
  });
  if (!res.ok) {
    const data = await res.json();
    throw new ApiError(data.error || "Error al registrar venta", res.status);
  }
  return res.json();
}

export async function updatePagadoA(ventaId, pagadoA) {
  const res = await apiFetch(`/sales/${ventaId}/pagadoA`, {
    method: "PATCH",
    body: JSON.stringify({ pagadoA }),
  });
  if (!res.ok) throw new Error("Error al actualizar receptor de pago");
  return res.json();
}

// ─── SUSCRIPCIONES ────────────────────────────────────────────────────────────

export async function deliverSubscription(payload) {
  const res = await apiFetch("/subscriptions/deliver", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    // Puede retornar requiereMulta con sugerencia
    if (data.requiereMulta) return data;
    throw new Error(data.error || "Error en la entrega de suscripción");
  }
  return res.json();
}

// ─── LIQUIDACIONES ────────────────────────────────────────────────────────────

export async function previewLiquidacion(vendedorId) {
  const res = await apiFetch(`/liquidations/preview/${vendedorId}`);
  if (!res.ok) throw new Error("Error al obtener preview de liquidación");
  return res.json();
}

export async function executeLiquidacion(vendedorId) {
  const res = await apiFetch("/liquidations/execute", {
    method: "POST",
    body: JSON.stringify({ vendedorId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al ejecutar liquidación");
  }
  return res.json();
}

// ─── INVENTARIO ───────────────────────────────────────────────────────────────

export async function assignInventory(vendedorId, vapeId, cantidad) {
  const res = await apiFetch("/inventory/assign", {
    method: "POST",
    body: JSON.stringify({ vendedorId, vapeId, cantidad }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al asignar inventario");
  }
  return res.json();
}

export async function getInventory() {
  const res = await apiFetch("/inventory");
  if (!res.ok) throw new Error("Error al obtener inventario detallado");
  return res.json();
}

export async function updateAssignedInventory(id, cantidad) {
  const res = await apiFetch(`/inventory/${id}`, {
    method: "PUT",
    body: JSON.stringify({ cantidad }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al actualizar asignación");
  }
  return res.json();
}

export async function removeAssignedInventory(id) {
  const res = await apiFetch(`/inventory/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Error al remover asignación");
  }
  return res.json();
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export async function getAnalytics() {
  const res = await apiFetch("/analytics");
  if (!res.ok) throw new Error("Error al obtener analytics");
  return res.json();
}
