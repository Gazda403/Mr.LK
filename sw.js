// ============================================================
//  MR. LK STUDIO — Service Worker
//  Caches all static assets for instant repeat visits
// ============================================================

const CACHE = 'mrlk-v1';

// Everything to pre-cache on first install
const PRECACHE = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/main.css',
  '/js/main.js',
  '/js/preloader.js',
  '/js/cursor.js',
  '/js/scroll.js',
  '/js/animations.js',
  '/js/gradientBars.js',
  '/js/scrollPath.js',
  '/js/fluidParticles.js',
  '/js/spline-viewer.js',
  '/js/vendor/gsap.min.js',
  '/js/vendor/ScrollTrigger.min.js',
  '/js/vendor/lenis.min.js',
  '/assets/scene.splinecode',
  '/assets/projects/project-01.webp',
  '/assets/projects/project-02.webp',
  '/assets/projects/project-03.webp',
  '/assets/projects/project-04.webp',
  '/assets/projects/project-05.webp',
];

// Install: pre-cache everything in parallel
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Cache-first for all requests
self.addEventListener('fetch', (e) => {
  // Only handle GET, skip cross-origin non-CDN
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;

      // Not in cache yet — fetch, clone, store
      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        return response;
      });
    })
  );
});
