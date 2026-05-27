const CACHE_NAME = "recordapp-static-v2";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg"
];

function isCacheableStaticRequest(requestUrl) {
  return (
    requestUrl.pathname.startsWith("/icons/") ||
    requestUrl.pathname.startsWith("/product-visuals/") ||
    requestUrl.pathname === "/manifest.webmanifest" ||
    requestUrl.pathname.startsWith("/_next/static/")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (
    event.request.mode === "navigate" ||
    requestUrl.pathname.startsWith("/auth") ||
    requestUrl.pathname.startsWith("/api") ||
    requestUrl.pathname.startsWith("/app")
  ) {
    return;
  }

  if (!isCacheableStaticRequest(requestUrl)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse ?? networkFetch;
    })
  );
});
