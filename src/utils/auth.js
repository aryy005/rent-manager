// Auth token management
const KEY = 'rentmaster_token';
const USER_KEY = 'rentmaster_user';

export const authStore = {
  getToken: () => localStorage.getItem(KEY),
  setToken: (t) => localStorage.setItem(KEY, t),
  getUser:  () => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } },
  setUser:  (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clear:    () => { localStorage.removeItem(KEY); localStorage.removeItem(USER_KEY); },
  isLoggedIn: () => !!localStorage.getItem(KEY),
};
