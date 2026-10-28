const CACHE_NAME = 'awb-apps-v4'; // Naikkan versi setiap kali ada perubahan kode
const urlsToCache = [
  './',
  './index.html',
  './slip.html',
  './stok.html',
  './style.css',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
});

self.addEventListener('fetch', e => {
  // JANGAN cache version.json, biarkan selalu ambil dari internet
  if (e.request.url.includes('version.json')) {
    return e.respondWith(fetch(e.request));
  }

  // Untuk file lain, gunakan cache (Cache First)
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
