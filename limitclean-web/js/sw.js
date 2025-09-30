const CACHE_NAME = 'limitclean-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/js/main.js',
  '/js/router.js',
  '/js/auth.js',
  '/js/db.js',
  '/js/utils/cpfCnpj.js',
  '/js/utils/dates.js',
  '/js/utils/money.js',
  '/js/utils/pdf.js',
  '/js/utils/crypto.js',
  '/js/services/discounts.js',
  '/js/services/entries.js',
  '/js/services/users.js',
  '/js/services/tickets.js',
  '/js/views/login.js',
  '/js/views/dashboard.js',
  '/js/views/cadastro.js',
  '/js/views/config.js',
  '/js/views/support.js',
  '/assets/logo.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => cached))
  );
});
