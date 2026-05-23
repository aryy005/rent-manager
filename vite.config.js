import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['villa_bg.png', 'building_bg.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'RentMaster – Rent Management App',
        short_name: 'RentMaster',
        description: 'Track rooms, rent, receipts & reports for Indian landlords.',
        theme_color: '#f59e0b',
        background_color: '#faf7f2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Cache strategy: runtime caching rules
        runtimeCaching: [
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // API calls — Network first, fallback to cache
            urlPattern: /^\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // Static assets — Cache first
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
        // Skip waiting so updates apply immediately
        skipWaiting: true,
        clientsClaim: true,
      },
      // Dev options — show SW in dev mode too
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 3005,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
