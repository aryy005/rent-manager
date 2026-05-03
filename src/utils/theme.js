// Persist theme preference
const KEY = 'rentmaster_theme';
export const themeStore = {
  get: () => localStorage.getItem(KEY) || 'dark',
  set: (t) => { localStorage.setItem(KEY, t); applyTheme(t); },
  toggle: () => {
    const next = themeStore.get() === 'dark' ? 'light' : 'dark';
    themeStore.set(next);
    return next;
  },
};

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// Apply on load
applyTheme(themeStore.get());
