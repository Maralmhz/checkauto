// CheckAuto Service Worker v7 — Network-first sem cache de HTML/JS/CSS
// Garante que o app mobile sempre carrega a versão mais recente
const CACHE_NAME = 'checkauto-v7';

// Apenas assets estáticos que raramente mudam (ícones e imagens)
const STATIC_ASSETS = [
  '/checkauto/favicon.png',
  '/checkauto/icon-192.png',
  '/checkauto/icon-512.png',
  '/checkauto/logo-default.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .catch(() => {})
  );
  // Força ativação imediata sem esperar fechar abas
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Nunca intercepta Supabase, CDNs ou APIs externas
  if (
    url.includes('supabase.co') ||
    url.includes('supabase.io') ||
    url.includes('cdn.jsdelivr.net') ||
    url.includes('cdnjs.cloudflare.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com') ||
    url.includes('api.telegram.org')
  ) return;

  const isHTML = event.request.headers.get('accept')?.includes('text/html');
  const isScript = url.endsWith('.js');
  const isStyle = url.endsWith('.css');

  // HTML, JS e CSS: SEMPRE busca na rede, sem cachear
  // Garante que o app mobile abre sempre com a versão mais recente
  if (isHTML || isScript || isStyle) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(event.request)) // fallback se offline
    );
    return;
  }

  // Imagens/ícones: cache-first (economiza banda)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return res;
      });
    })
  );
});
