/* Fun With Math — offline support.
 * IMPORTANT: bump CACHE_VERSION on every release (and APP_VERSION in app.js to match),
 * so the iPad downloads the new files.
 */
const CACHE_VERSION = '1.0.0';
const CACHE_NAME = 'fun-with-math-' + CACHE_VERSION;

const FILES = [
  './',
  './index.html',
  './style.css',
  './logic.js',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // cache: 'reload' skips the browser's HTTP cache so we really get the new files.
      .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith('fun-with-math-') && k !== CACHE_NAME)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache first (works with no internet). Pages fall back to the cached index.html.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(req, { ignoreSearch: true }).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res && res.ok && url.pathname.startsWith(new URL('./', self.location).pathname)) {
            cache.put(req, res.clone());
          }
          return res;
        }).catch(() => {
          if (req.mode === 'navigate') return cache.match('./index.html');
          return Response.error();
        });
      })
    )
  );
});
