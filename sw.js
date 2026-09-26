// sw.js — Falak PCNU Bangkalan: offline cache
// PENTING: setiap kali index.html diperbarui, NAIKKAN nomor pada CACHE_NAME di bawah.
//
// Strategi (diperbaiki 26 Sep 2026 — versi lama SELALU menyajikan cache lama tanpa
// batas waktu (comment lama menyebut "stale-while-revalidate" tapi kodenya cache-first
// selamanya), sehingga pembaruan tidak pernah terlihat walau app dibuka-tutup berkali-kali):
//   • Dokumen HTML (index.html) → NETWORK-FIRST: coba ambil versi terbaru dulu;
//     cache hanya dipakai sbg cadangan kalau benar-benar offline.
//   • Aset lain → cache-first + revalidate di belakang layar.

const CACHE_NAME = 'falak-pcnu-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const isDocument = e.request.mode === 'navigate' || e.request.destination === 'document';

  if (isDocument) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
