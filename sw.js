// ============================================================
//  MR. LK STUDIO — Service Worker
//  Caches static assets for instant repeat visits
// ============================================================

const CACHE = 'mrlk-v2';

// Everything to pre-cache on first install (relative paths for GitHub Pages compatibility)
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
  './assets/projects/project-01.webp',
  './assets/projects/project-02.webp',
  './assets/projects/project-03.webp',
  './assets/projects/project-04.webp',
  './assets/projects/project-05.webp',
];

// Install: pre-cache everything in parallel
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
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
  if (e.request.method !== 'GET') return;

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
