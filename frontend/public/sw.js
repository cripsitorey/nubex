const CACHE_NAME = 'nubex-shell-v1';
const SHELL_URLS = ['/', '/manifest.json', '/icon-192x192.png', '/icon-512x512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Solo cacheamos navegación de páginas (app shell) para poder abrir la app
// sin red. Las llamadas a /api/* NUNCA se sirven desde cache: la cola de
// ventas offline vive en IndexedDB (ver syncService.js), no en el SW.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return;
  if (request.mode !== 'navigate' && !SHELL_URLS.includes(url.pathname)) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  );
});
