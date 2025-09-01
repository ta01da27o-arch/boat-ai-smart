self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("boat-ai-cache").then((cache) => {
      return cache.addAll([
        "./index.html",
        "./style.css",
        "./app.js",
        "./data.json",
        "./manifest.json"
      ]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});