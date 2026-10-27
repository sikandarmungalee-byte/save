// ============================================================================
// Savouré Artisanal Pastry ERP — Enterprise Service Worker (sw.js)
// Offline Caching, Network-First Sync, and Standalone App Gateway
// ============================================================================

const CACHE_VERSION = 'savoure-erp-v1.2.0';
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `dynamic-${CACHE_VERSION}`;

// Core assets required to run the ERP offline shell
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/images/savoure/savoure-logo.png'
];

// Install Event: Precaches application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(PRECACHE_ASSETS);
      } catch (err) {
        console.warn('[Service Worker] Non-fatal precache asset notice:', err);
      }
      return self.skipWaiting();
    })
  );
});

// Activate Event: Cleans up obsolete cache buckets
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            console.log('[Service Worker] Removing old cache partition:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first with dynamic offline caching
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Bypass non-GET requests, Firebase auth endpoints, and internal websockets
  if (req.method !== 'GET') return;
  if (url.origin.includes('firestore.googleapis.com') || url.origin.includes('identitytoolkit')) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_')) return;

  // Navigation requests: HTML navigation uses Network-First with Cache fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put('/', resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match('/');
          if (fallback) return fallback;
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width,initial-scale=1.0">
              <title>Savouré ERP — Offline</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #171311; color: #FFF9F0; padding: 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: #221B17; border: 1px solid #3A2D25; border-radius: 1.5rem; padding: 2.5rem; max-width: 480px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
                h1 { color: #E0A282; margin-top: 0; font-size: 1.5rem; }
                p { color: #C5B7AC; font-size: 0.9rem; line-height: 1.6; }
                button { background: #C98A5B; color: #171311; border: none; padding: 0.75rem 1.75rem; border-radius: 9999px; font-weight: 700; cursor: pointer; margin-top: 1rem; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Offline Standalone Mode</h1>
                <p>Savouré ERP is currently disconnected from the bakery network. Reconnect to sync pending POS sales and stock transfers.</p>
                <button onclick="window.location.reload()">Retry Connection</button>
              </div>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Static Assets (Scripts, CSS, Fonts, Images): Cache-First with Network Revalidation
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => cachedRes);

      return cachedRes || fetchPromise;
    })
  );
});

// Communication channel with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
