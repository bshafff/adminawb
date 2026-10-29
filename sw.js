const CACHE_NAME = 'awb-apps-v17';
const urlsToCache = [
  './',
  './index.html',
  './slip.html',
  './stok.html',
  './aset.html',
  './invoice.html',
  './style.css',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js'
];

/* Install: cache satu per satu pakai allSettled supaya kalau ada 1 URL gagal,
   install SW tetap sukses (URL itu akan di-fetch online saat dipakai). */
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(async c => {
      const results = await Promise.allSettled(urlsToCache.map(u => c.add(u)));
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.warn('[SW] Gagal cache:', urlsToCache[i], r.reason && r.reason.message);
        }
      });
    })
  );
});

/* Activate: hapus cache versi lama, ambil alih tab yang terbuka. */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Fetch: cache-first, lalu network. Response yang valid ikut disimpan (runtime cache). */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // version.json HARUS selalu dari network (biar deteksi update akurat)
  if (e.request.url.includes('version.json')) {
    return e.respondWith(fetch(e.request));
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Simpan ke cache hanya response yang sah (200 & bukan opaque)
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(e.request));
    })
  );
});
