// PWA Service Worker with safe offline caching
// - Cache First for static assets (icons, manifest, Next static chunks)
// - Network First for navigations with offline fallback

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/maskable-icon-192.svg',
  '/icons/maskable-icon-512.svg',
  '/icons/monochrome-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![SHELL_CACHE, STATIC_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isSameOrigin(url) {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
}

function isStaticAsset(url) {
  if (!isSameOrigin(url)) return false;
  const { pathname } = new URL(url);
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.endsWith('.webmanifest') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.woff2')
  );
}

async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  // Only cache successful, basic or opaque same-origin assets
  if (res && (res.status === 200 || res.type === 'opaqueredirect' || res.type === 'opaque')) {
    cache.put(req, res.clone()).catch(() => null);
  }
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // do not cache POST/others

  // Navigations: Network First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request);
          return res;
        } catch (err) {
          const offline = await caches.match('/offline.html');
          return offline ?? new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // Static assets: Cache First
  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  // Default: pass-through
});
