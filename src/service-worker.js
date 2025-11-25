// Simple service worker for offline caching (basic setup)
const CACHE_NAME = 'expenses-wallet-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/icons/icon-48.webp',
  '/assets/icons/icon-72.webp',
  '/assets/icons/icon-96.webp',
  '/assets/icons/icon-128.webp',
  '/assets/icons/icon-192.webp',
  '/assets/icons/icon-256.webp',
  '/assets/icons/icon-512.webp',
  // Add more assets/routes as needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});
