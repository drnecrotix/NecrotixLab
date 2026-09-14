/* Opt-in NecrotixLab service worker. Registered only from NativePwaLayer
   when Admin → PWA App enables it. Never caches /admin or /api. */
const VERSION = 'necrotix-pwa-v1';
const OFFLINE_URL = '/offline.html';
const enableOffline = new URL(self.location.href).searchParams.get('offline') === '1';

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(VERSION);
        if (enableOffline) {
            await cache.addAll([OFFLINE_URL, '/favicon.svg']).catch(() => undefined);
        }
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))),
    );
    self.clients.claim();
});

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    if (!enableOffline) return;
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) return;
    if (request.mode !== 'navigate') return;

    event.respondWith(
        fetch(request).catch(() => caches.match(OFFLINE_URL).then((cached) => cached || Response.error())),
    );
});
