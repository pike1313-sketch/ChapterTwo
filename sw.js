// Increment version string whenever pushing a major frontend update
const CACHE_NAME = 'chaptertwo-v2';

const ASSETS_TO_CACHE = [
  './',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Instantly activates new service worker
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k); // Wipes out old cached versions
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Let Google Apps Script API calls pass directly over the network
  if (e.request.url.includes('script.google.com') || e.request.url.includes('script.googleusercontent.com')) {
    return;
  }

  // Network-first for index.html: checks GitHub for updates, falls back to cache if offline
  if (e.request.mode === 'navigate' || e.request.url.endsWith('index.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for icons and manifest
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
