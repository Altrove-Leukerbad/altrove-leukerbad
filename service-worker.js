// service-worker.js
const CACHE = "altrove-v3"; // bumpa questo quando cambi file
const ASSETS = [
  // Pagine
  "/",
  "/index.html",
  "/appartamento.html",
  "/cosa-fare.html",
  "/info-e-guest-card.html",
  "/contatti-e-richiedi-un-offerta.html",

  // Stili & immagini base
  "/styles.css",
  "/logo.png",
  "/img/favicon.png",

  // PWA
  "/manifest.webmanifest",
  "/icons/web-app-manifest-192x192.png",
  "/icons/web-app-manifest-512x512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-96x96.png",
  "/icons/favicon.svg",
  "/icons/favicon.ico"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS))
  );
  self.skipWaiting(); // attiva subito il nuovo SW
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // prendi controllo immediatamente
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const isPage = req.mode === "navigate";

  e.respondWith((async () => {
    if (isPage) {
      // Network-first per HTML
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(req)) || (await cache.match("/index.html"));
      }
    } else {
      // Asset: cache-first con fallback a rete
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;

      try {
        const fresh = await fetch(req);
        if (req.method === "GET") cache.put(req, fresh.clone());
        return fresh;
      } catch {
        return cached || Response.error();
      }
    }
  })());
});

// Permette alla pagina di forzare l’attivazione del nuovo SW
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
