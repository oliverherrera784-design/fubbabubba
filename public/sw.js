// Service Worker - Fubba Bubba POS v2
const CACHE_VERSION = 'v2';
const CACHE_NAME = `fubba-pos-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `fubba-data-${CACHE_VERSION}`;

// Assets estáticos que siempre cachear
const STATIC_ASSETS = [
  '/pos',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/manifest.json',
];

// APIs de datos para cache offline (GET)
const DATA_URLS = [
  '/api/productos',
  '/api/categorias',
  '/api/sucursales',
  '/api/pos/modificadores',
  '/api/empleados',
];

// Instalar: cachear assets estáticos + pre-cargar datos
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cachear assets estáticos
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Pre-cargar datos de API para offline
      caches.open(DATA_CACHE_NAME).then(async (cache) => {
        console.log('[SW] Pre-cargando datos de API');
        for (const url of DATA_URLS) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
              console.log('[SW] Datos cacheados:', url);
            }
          } catch (e) {
            console.warn('[SW] No se pudo pre-cargar:', url);
          }
        }
      }),
    ])
  );
  self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DATA_CACHE_NAME)
          .map((key) => {
            console.log('[SW] Eliminando cache viejo:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// Mensaje del cliente para refrescar datos en cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REFRESH_DATA_CACHE') {
    event.waitUntil(refreshDataCache());
  }
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Refrescar el cache de datos (llamado después de cada venta o al abrir el POS)
async function refreshDataCache() {
  const cache = await caches.open(DATA_CACHE_NAME);
  for (const url of DATA_URLS) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (e) {
      // Sin conexión, mantener cache existente
    }
  }
  console.log('[SW] Cache de datos refrescado');
}

// Fetch: estrategia según tipo de request
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Solo manejar requests del mismo origen
  if (url.origin !== self.location.origin) return;

  // Solo manejar requests GET
  if (event.request.method !== 'GET') return;

  // APIs de datos: Network First, fallback a cache
  if (DATA_URLS.some((dataUrl) => url.pathname.startsWith(dataUrl))) {
    event.respondWith(networkFirstData(event.request));
    return;
  }

  // Páginas de navegación: Network First, fallback a cache
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstPage(event.request));
    return;
  }

  // Assets estáticos (JS, CSS, imágenes, fonts): Cache First
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff2?|css|js)$/)
  ) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
});

// Network First para datos de API
async function networkFirstData(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Sirviendo datos desde cache:', request.url);
      // Agregar header para que el cliente sepa que viene del cache
      const headers = new Headers(cached.headers);
      headers.set('X-From-Cache', 'true');
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
    return new Response(
      JSON.stringify({ success: false, error: 'Sin conexión y sin datos en cache', offline: true }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Network First para páginas
async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      console.log('[SW] Sirviendo página desde cache:', request.url);
      return cached;
    }
    // Fallback: intentar servir /pos desde cache
    return caches.match('/pos') || new Response(
      '<html><body style="font-family:sans-serif;text-align:center;padding:50px"><h1>Sin conexión</h1><p>No hay datos en cache. Conéctate a internet y recarga.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Cache First para assets estáticos
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408 });
  }
}
