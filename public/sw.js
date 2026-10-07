/**
 * Service worker SatuJanji — membuat aplikasi bisa dibuka lagi tanpa jaringan.
 *
 * Strategi:
 * - Navigasi (halaman): network-first, jatuh ke `index.html` dari cache saat
 *   offline, supaya pembaruan aplikasi tetap cepat terpasang.
 * - Aset statis (JS/CSS/gambar ber-hash): cache-first, lalu simpan salinannya.
 * - Permintaan ke origin lain (Convex realtime/API) tidak pernah disentuh,
 *   jadi data selalu segar dan tidak ada respons API yang ter-cache.
 *
 * Naikkan versi CACHE kalau perilaku cache berubah supaya cache lama dibuang.
 */
const CACHE = "satujanji-v1";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/logo.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Simpan salinan respons yang boleh di-cache. */
function remember(request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") {
    return response;
  }
  const copy = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Hanya aset aplikasi sendiri: backend Convex berada di origin berbeda.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => remember(request, response))
        .catch(() => caches.match("/index.html").then((cached) => cached ?? Response.error())),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => remember(request, response)),
    ),
  );
});
