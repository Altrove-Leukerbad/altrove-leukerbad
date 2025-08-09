const CACHE = "altrove-v2"; // bump versione quando cambi qualcosa
const ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/logo.png",
  "/img/favicon.png",

  // Pagine principali
  "/appartamento.html",
  "/cosa-fare.html",
  "/info-e-guest-card.html",
  "/contatti-e-richiedi-un-offerta.html",

  // PWA
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const isPage = req.mode === "navigate";

  e.respondWith(
    (async () => {
      if (isPage) {
        // Network-first per le pagine
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
        // Asset: cache-first
        const cache = await caches.open(CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;

        try {
          const fresh = await fetch(req);
          if (req.method === "GET") cache.put(req, fresh.clone()); // <- solo GET
          return fresh;
        } catch {
          return cached || Response.error();
        }
      }
    })()
  );
});
