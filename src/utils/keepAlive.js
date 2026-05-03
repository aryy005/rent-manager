import { useEffect } from 'react';
import { api } from './api';

/**
 * useKeepAlive — pings /api/health every 10 minutes while the app is open.
 * This is a secondary keep-alive on top of the backend self-ping,
 * ensuring the server stays warm when users are actively browsing.
 */
export function useKeepAlive() {
  useEffect(() => {
    const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

    // Ping immediately on mount (wakes a sleeping server right away)
    const initialPing = setTimeout(() => {
      api.ping().catch(() => {}); // silent — errors are expected if sleeping
    }, 3000); // wait 3s after mount so auth state is settled

    const interval = setInterval(() => {
      api.ping().catch(() => {});
    }, INTERVAL_MS);

    return () => {
      clearTimeout(initialPing);
      clearInterval(interval);
    };
  }, []);
}
