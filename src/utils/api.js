const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Rooms
  getRooms:    ()          => request('/rooms'),
  addRoom:     (data)      => request('/rooms',     { method: 'POST', body: data }),
  deleteRoom:  (id)        => request(`/rooms/${id}`, { method: 'DELETE' }),

  // Tenants
  getRoomTenantHistory: (roomId) => request(`/rooms/${roomId}/tenants`),
  addTenant:   (roomId, data) => request(`/rooms/${roomId}/tenants`, { method: 'POST', body: data }),
  updateCurrentTenant: (roomId, data) => request(`/rooms/${roomId}/tenants/current`, { method: 'PATCH', body: data }),
  moveOutTenant: (roomId) => request(`/rooms/${roomId}/tenants/current`, { method: 'DELETE' }),

  // Bills
  getRoomBills: (roomId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/rooms/${roomId}/bills${qs ? `?${qs}` : ''}`);
  },
  addOrUpdateBill: (roomId, data) => request(`/rooms/${roomId}/bills`, { method: 'POST', body: data }),

  // Bills - mark paid/unpaid
  markBillStatus: (billId, is_paid) => request(`/bills/${billId}/status`, { method: 'PATCH', body: { is_paid } }),

  // Pending rent reminders
  getPendingRents: () => request('/pending-rents'),

  // Stats
  getStats: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/stats${qs ? `?${qs}` : ''}`);
  },
};
