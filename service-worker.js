const CACHE = "altrove-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/img/favicon.png",
  "/logo.png",
  "/appartamento.html",
  "/cosa-fare.html",
  "/info-e-guest-card.html",
  "/contatti-e-richiedi-un-offerta.html"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const req = e.request;
  // network-first per pagine; cache-first per asset
  const isPage = req.mode === "navigate";
  e.respondWith(
    (async () => {
      if (isPage) {
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
        const cache = await caches.open(CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return cached || Response.error();
        }
      }
    })()
  );
});
