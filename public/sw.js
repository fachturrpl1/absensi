const CACHE_VERSION = 'v1';
const CACHE_NAME = `presensi-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `presensi-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE = `presensi-images-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/offline',
];

const _MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_ITEMS = 50;

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => !currentCaches.includes(cacheName))
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Cache limiter
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName, maxItems);
  }
}

// Helper: Check if response is cacheable
function isCacheable(response) {
  return response.status === 200 && 
         response.type === 'basic' &&
         !response.headers.get('cache-control')?.includes('no-store');
}

// Fetch event - Smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests and Supabase requests - always fetch fresh
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/data/') ||
    url.hostname.includes('supabase')
  ) {
    return;
  }

  // Cache Strategy: Images - Cache First
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (isCacheable(response)) {
            const responseClone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, responseClone);
              limitCacheSize(IMAGE_CACHE, MAX_CACHE_ITEMS);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Cache Strategy: Static assets - Cache First with Network Fallback
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((response) => {
          if (isCacheable(response)) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Cache Strategy: Pages - Network First with Cache Fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (isCacheable(response)) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
            limitCacheSize(RUNTIME_CACHE, MAX_CACHE_ITEMS);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain',
            }),
          });
        });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
