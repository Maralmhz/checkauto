// CheckAuto Service Worker — cache básico para instalação PWA
const CACHE_NAME = 'checkauto-v1';
const ASSETS = [
  '/checkauto/',
  '/checkauto/index.html',
  '/checkauto/styles.css',
  '/checkauto/checklist.css',
  '/checkauto/dashboard-cards.css',
  '/checkauto/os-styles.css',
  '/checkauto/agendamento-styles.css',
  '/checkauto/logo-default.png',
  '/checkauto/app.js',
  '/checkauto/checklist.js',
  '/checkauto/clientes.js',
  '/checkauto/veiculos.js',
  '/checkauto/financeiro.js',
  '/checkauto/agendamento.js',
  '/checkauto/ordens-servico.js',
  '/checkauto/configuracoes.js',
  '/checkauto/masks.js',
  '/checkauto/supabase.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: tenta rede, cai no cache se offline
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
