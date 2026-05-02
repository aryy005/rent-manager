import { useState, useEffect, useCallback } from 'react';

let toastId = 0;
const listeners = new Set();

export const toast = {
  _emit(msg) { listeners.forEach(fn => fn(msg)); },
  success(text) { this._emit({ id: ++toastId, type: 'success', text }); },
  error(text)   { this._emit({ id: ++toastId, type: 'error',   text }); },
};

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (msg) => {
      setToasts(prev => [...prev, msg]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== msg.id)), 3500);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  return toasts;
}
