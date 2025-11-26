const CACHE_NAME = 'presiones-cache-v15';
const urlsToCache = [
  './',
  './index.html?v=3',
  './manifest.json?v=3',
  './sw.js?v=3',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js',
  './icon-512.png',
  './icon-192.png',
];

// --- Instalar y forzar actualización inmediata ---
self.addEventListener('install', event => {
  self.skipWaiting(); // Fuerza a que este SW se active sin esperar
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Archivos cacheados');
      return cache.addAll(urlsToCache);
    })
  );
});

// --- Activar y tomar control de inmediato ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Eliminando caché viejo:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  clients.claim(); // Obliga a que todas las pestañas usen este SW
});

// --- Servir desde caché y actualizar ---
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return (
        response ||
        fetch(event.request).catch(() => {
          // Aquí puedes retornar una página offline si quieres
        })
      );
    })
  );
});












