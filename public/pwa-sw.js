/* Opt-in NecrotixLab service worker. Registered only from NativePwaLayer
   when Admin → PWA App enables it. Never caches /admin or /api.
   APP_VERSION must match package.json so a release always produces a new worker. */
const APP_VERSION = '1.3.42';
const VERSION = `necrotix-pwa-v${APP_VERSION}`;
const OFFLINE_URL = '/offline.html';
const enableOffline = new URL(self.location.href).searchParams.get('offline') === '1';
const PRECACHE = [
    OFFLINE_URL,
    '/',
    '/blog',
    '/projects',
    '/gallery',
    '/contact',
    '/pwa/icon-192.png',
    '/pwa/icon-512.png',
    '/favicon.svg',
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(VERSION);
        if (enableOffline) {
            await cache.addAll(PRECACHE).catch(() => undefined);
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

function isPrivatePath(pathname) {
    return pathname.startsWith('/admin') || pathname.startsWith('/api') || pathname === '/pwa-sw.js';
}

function isStaticAsset(pathname) {
    return pathname.startsWith('/_next/static/')
        || pathname.startsWith('/pwa/')
        || pathname.startsWith('/uploads/')
        || /\.(?:png|jpe?g|webp|gif|svg|ico|woff2?|css)$/i.test(pathname);
}

self.addEventListener('fetch', (event) => {
    if (!enableOffline) return;
    const request = event.request;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;
    if (isPrivatePath(url.pathname)) return;

    if (request.mode === 'navigate') {
        event.respondWith((async () => {
            const cache = await caches.open(VERSION);
            try {
                const fresh = await fetch(request);
                if (fresh.ok) await cache.put(request, fresh.clone());
                return fresh;
            } catch {
                const cached = await cache.match(request);
                return cached || (await cache.match(OFFLINE_URL)) || Response.error();
            }
        })());
        return;
    }

    if (!isStaticAsset(url.pathname)) return;

    event.respondWith((async () => {
        const cache = await caches.open(VERSION);
        const cached = await cache.match(request);
        const network = fetch(request).then((fresh) => {
            if (fresh.ok) void cache.put(request, fresh.clone());
            return fresh;
        }).catch(() => undefined);
        return cached || (await network) || Response.error();
    })());
});
