/* ═══════════════════════════════════════════════════════
   RentMaster – Service Worker  (Workbox-powered PWA)
   Handles: offline caching, background sync, push hints
   ═══════════════════════════════════════════════════════ */

const CACHE_NAME = 'rentmaster-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/villa_bg.png',
  '/building_bg.png',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

/* ── Install: pre-cache static shell ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* ── Activate: clean old caches ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch strategy ──
   • API calls   → Network-first (always fresh data)
   • Assets      → Cache-first  (fast offline load)
   • Navigation  → SPA fallback → /index.html
*/
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // API → Network-first
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then((res) => res)
        .catch(() => new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        }))
    );
    return;
  }

  // Navigation → serve index.html (SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }

  // Assets → Cache-first
  event.respondWith(
    caches.match(request).then(
      (cached) => cached || fetch(request).then((res) => {
        // Cache valid responses
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      })
    )
  );
});

/* ── Push notifications (future feature hook) ── */
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'RentMaster', {
      body: data.body || 'You have a new notification.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'rentmaster-notification',
      renotify: true,
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
