import { authStore } from './auth';

const RENDER_URL = 'https://rent-manager-wquz.onrender.com';
const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? RENDER_URL : '');

async function request(path, options = {}) {
  const token = authStore.getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api${path}`, {
    headers,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    authStore.clear();
    window.location.href = '/login';
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  signup: (data)  => request('/auth/signup', { method: 'POST', body: data }),
  login:  (data)  => request('/auth/login',  { method: 'POST', body: data }),
  getMe:  ()      => request('/auth/me'),

  // ── Properties ────────────────────────────────────────────────────────────
  getProperties:    ()           => request('/properties'),
  addProperty:      (data)       => request('/properties',     { method: 'POST',   body: data }),
  updateProperty:   (id, data)   => request(`/properties/${id}`, { method: 'PATCH', body: data }),
  deleteProperty:   (id)         => request(`/properties/${id}`, { method: 'DELETE' }),

  // ── Rooms (property-scoped) ───────────────────────────────────────────────
  getRooms:    (propertyId)      => request(`/properties/${propertyId}/rooms`),
  addRoom:     (propertyId, data) => request(`/properties/${propertyId}/rooms`, { method: 'POST', body: data }),
  deleteRoom:  (id)              => request(`/rooms/${id}`, { method: 'DELETE' }),

  // ── Tenants ───────────────────────────────────────────────────────────────
  getRoomTenantHistory:  (roomId)       => request(`/rooms/${roomId}/tenants`),
  addTenant:             (roomId, data) => request(`/rooms/${roomId}/tenants`, { method: 'POST', body: data }),
  updateCurrentTenant:   (roomId, data) => request(`/rooms/${roomId}/tenants/current`, { method: 'PATCH', body: data }),
  moveOutTenant:         (roomId)       => request(`/rooms/${roomId}/tenants/current`, { method: 'DELETE' }),

  // ── Bills ─────────────────────────────────────────────────────────────────
  getRoomBills:    (roomId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/rooms/${roomId}/bills${qs ? `?${qs}` : ''}`);
  },
  addOrUpdateBill: (roomId, data) => request(`/rooms/${roomId}/bills`, { method: 'POST', body: data }),
  markBillStatus:  (billId, is_paid) => request(`/bills/${billId}/status`, { method: 'PATCH', body: { is_paid } }),

  // ── Pending rents & stats (property-scoped) ───────────────────────────────
  getPendingRents: (propertyId) => request(`/properties/${propertyId}/pending-rents`),
  getStats:        (propertyId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/properties/${propertyId}/stats${qs ? `?${qs}` : ''}`);
  },

  // ── Auto-bill generation ──────────────────────────────────────────────────
  autoBill: (propertyId, year, month) =>
    request(`/properties/${propertyId}/auto-bill`, { method: 'POST', body: { year, month } }),

  // ── Late fees ─────────────────────────────────────────────────────────────
  getLateFees: (propertyId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/properties/${propertyId}/late-fees${qs ? `?${qs}` : ''}`);
  },

  // ── Maintenance log ───────────────────────────────────────────────────────
  getMaintenance:    (propertyId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/properties/${propertyId}/maintenance${qs ? `?${qs}` : ''}`);
  },
  addMaintenance:    (propertyId, data)  => request(`/properties/${propertyId}/maintenance`, { method: 'POST', body: data }),
  updateMaintenance: (id, data)          => request(`/maintenance/${id}`,  { method: 'PATCH',  body: data }),
  deleteMaintenance: (id)                => request(`/maintenance/${id}`,  { method: 'DELETE' }),

  // ── Rent increase history ─────────────────────────────────────────────────
  getRentHistory:  (roomId)       => request(`/rooms/${roomId}/rent-history`),
  updateRent:      (roomId, data) => request(`/rooms/${roomId}/rent`, { method: 'PATCH', body: data }),
};
