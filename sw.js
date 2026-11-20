/* Fetch the shell fresh online, and keep the optional runtime for offline inference. */
const CACHE = 'codelinker-v2';
const CORE = ['./', './index.html', './rival-model.mjs', './manifest.webmanifest',
  './icons/apple-touch-icon.png', './icons/icon-192.png', './icons/icon-512.png'];
const RIVAL_RUNTIME = 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/';

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.delete('codelinker-v1').then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === location.origin;
  const optional = url.href.startsWith(RIVAL_RUNTIME) || /^(fonts\.googleapis|fonts\.gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !optional) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const stored = await cache.match(request);
    if (optional && stored) return stored;
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch (error) {
      if (stored) return stored;
      if (request.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      throw error;
    }
  })());
});
