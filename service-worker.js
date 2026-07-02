/**
 * service-worker.js - Angkringan Senthir
 * Meng-cache app shell agar situs bisa diinstall sebagai PWA dan tetap
 * bisa dibuka (versi cache) walau koneksi internet putus-putus.
 */

const CACHE_NAME = 'senthir-cache-v1';

// App shell inti — file yang wajib ada supaya situs tetap bisa dibuka offline
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './favicon-16.png',
    './favicon-32.png',
    './favicon-48.png',
    './favicon-192.png',
    './favicon-512.png',
    './apple-touch-icon.png'
];

// Install: cache app shell. Pakai addAll dengan fallback per-file supaya
// satu file yang gagal (mis. ikon belum ada) tidak menggagalkan semua cache.
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                APP_SHELL.map((url) =>
                    cache.add(url).catch((err) => {
                        console.warn('[SW] Gagal cache:', url, err);
                    })
                )
            );
        })
    );
});

// Activate: bersihkan cache versi lama
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: strategi "stale-while-revalidate"
// — langsung kasih versi cache kalau ada (biar cepat & bisa offline),
// sambil diam-diam update cache dari network di belakang layar.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    // Biarkan request ke domain luar (WhatsApp, dsb) lewat apa adanya
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const networkFetch = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);

            return cachedResponse || networkFetch;
        })
    );
});
