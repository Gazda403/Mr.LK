// ============================================================
//  MR. LK STUDIO — Service Worker v3
// ============================================================

const CACHE = 'mrlk-v3';

const PRECACHE = [
  './',
  './index.html',
  './css/variables.css',
  './css/main.css',
  './js/main.js',
  './js/scene.js',
  './js/preloader.js',
  './js/cursor.js',
  './js/scroll.js',
  './js/animations.js',
  './js/gradientBars.js',
  './js/scrollPath.js',
  './js/fluidParticles.js',
  './js/vendor/gsap.min.js',
  './js/vendor/ScrollTrigger.min.js',
  './js/vendor/lenis.min.js',
  './assets/earth-texture.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Skip non-GET and non-http(s) requests (e.g. chrome-extension://)
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        return response;
      }).catch(() => cached);
    })
  );
});
