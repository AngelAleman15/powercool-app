// Service Worker para PowerCool PWA
const CACHE_NAME = 'powercool-v2';
const urlsToCache = [
  '/',
  '/equipos',
  '/clientes',
  '/tramites'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );

  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// Estrategia de cache: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // No interceptar requests cross-origin (ej: Supabase) para evitar errores de red del SW
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response) {
          return Response.error();
        }

        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fallback para navegación offline
        if (event.request.mode === 'navigate') {
          const home = await caches.match('/');
          if (home) {
            return home;
          }
        }

        // Garantizar que siempre devolvemos un Response válido
        return Response.error();
      })
  );
});

// Manejo de notificaciones push
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'PowerCool';
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'notification',
    requireInteraction: true,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
