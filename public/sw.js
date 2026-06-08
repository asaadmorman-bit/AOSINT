// EDS Field — Service Worker
// Caches last-known location data and critical assets for offline field use.

const CACHE_NAME = 'eds-field-v1';
const LOCATION_CACHE = 'eds-location-v1';

// Static shell assets to pre-cache
const PRECACHE_ASSETS = [
  '/',
  '/Dashboard',
  '/OperatorDashboard',
  '/OsintWorkbench',
];

// Install: pre-cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate: purge old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== LOCATION_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache last-known location writes from the app
  if (url.pathname.includes('/last-location')) {
    event.respondWith(
      caches.open(LOCATION_CACHE).then(async (cache) => {
        try {
          const response = await fetch(event.request.clone());
          cache.put(event.request, response.clone());
          return response;
        } catch {
          return cache.match(event.request);
        }
      })
    );
    return;
  }

  // API requests: network-first, fall back silently
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(JSON.stringify({ offline: true }), {
        headers: { 'Content-Type': 'application/json' },
      }))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Message: persist last-known location from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_LOCATION') {
    caches.open(LOCATION_CACHE).then((cache) => {
      const response = new Response(JSON.stringify(event.data.payload), {
        headers: { 'Content-Type': 'application/json' },
      });
      cache.put('/last-location', response);
    });
  }
});
