const CACHE_NAME = 'limitclean-cache-v3';
const assetPaths = [
  'index.html',
  'css/variables.css',
  'css/base.css',
  'css/components.css',
  'js/main.js',
  'js/router.js',
  'js/auth.js',
  'js/db.js',
  'js/utils/cpfCnpj.js',
  'js/utils/dates.js',
  'js/utils/money.js',
  'js/utils/pdf.js',
  'js/utils/crypto.js',
  'js/services/discounts.js',
  'js/services/entries.js',
  'js/services/users.js',
  'js/services/tickets.js',
  'js/views/login.js',
  'js/views/dashboard.js',
  'js/views/cadastro.js',
  'js/views/config.js',
  'js/views/support.js',
  'assets/logo.svg',
];

const scopeUrl = new URL(self.registration?.scope || self.location.href);
const INDEX_URL = new URL('index.html', scopeUrl).toString();
const ROOT_URL = new URL('./', scopeUrl).toString();

const toScopedPath = (path) => {
  const resolvedUrl = new URL(path, scopeUrl);
  if (!resolvedUrl.pathname.startsWith(scopeUrl.pathname)) {
    return resolvedUrl.pathname;
  }
  const relativePath = resolvedUrl.pathname.slice(scopeUrl.pathname.length);
  return relativePath ? `./${relativePath}` : './';
};

const ASSETS = assetPaths.map(toScopedPath);

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
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(INDEX_URL).then((cached) => cached || caches.match(ROOT_URL))
      )
    );
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => cached))
  );
});
