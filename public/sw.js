const CACHE_NAME = 'kmp-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/ui.js',
  '/src/style.css',
  '/logo.jpg',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(response => {
      // Return cached asset if found, else fetch from network
      return response || fetch(e.request).catch(() => {
        // Fallback or handle offline navigation
      });
    })
  );
});
