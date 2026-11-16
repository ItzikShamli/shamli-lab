/* Green Scientist — offline support.
 * IMPORTANT: bump CACHE_VERSION on every release (and VERSION in engine.js to match),
 * and list every new module file in FILES.
 */
const CACHE_VERSION = '1.2.0';
const CACHE_NAME = 'green-scientist-' + CACHE_VERSION;
const PHOTOS = 'green-scientist-photos'; // NASA photos, kept across versions

const FILES = [
  './',
  './index.html',
  './style.css',
  './engine.js',
  './sims.js',
  './sims-2.js',
  './sims-3.js',
  './modules/01-space-mars.js',
  './modules/02-newton-boomerang.js',
  './modules/03-dry-ice.js',
  './modules/04-light.js',
  './modules/05-vacuum.js',
  './modules/06-circuit.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith('green-scientist-') && k !== CACHE_NAME && k !== PHOTOS)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Photos from NASA: keep a copy once seen, so they also show offline.
  if (url.origin !== self.location.origin) {
    if (req.destination === 'image') {
      event.respondWith(caches.open(PHOTOS).then((cache) => cache.match(req).then((hit) => hit ||
        fetch(req).then((res) => { if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()); return res; }))));
    }
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(req, { ignoreSearch: true }).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res && res.ok && url.pathname.startsWith(new URL('./', self.location).pathname)) cache.put(req, res.clone());
          return res;
        }).catch(() => {
          if (req.mode === 'navigate') return cache.match('./index.html');
          return Response.error();
        });
      })
    )
  );
});
