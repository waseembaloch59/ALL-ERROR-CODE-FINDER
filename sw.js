const CACHE_NAME = "error-code-finder-v3";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.png",
  "/style.css",
  "/rukhsar.js",
  "/common-time.js",
  "/icon/icon-48.png",
  "/icon/icon-72.png",
  "/icon/icon-96.png",
  "/icon/icon-144.png",
  "/icon/icon-192.png",
  "/icon/icon-512.png",
  "/icon/icon-1024.png"
];

// INSTALL - Cache all static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // addAll one by one so one failure doesn't break everything
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("Failed to cache:", url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// ACTIVATE - Remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// FETCH - Cache first, then network, with offline fallback
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip external URLs (Firebase, Google APIs, CDN etc.)
  if (url.hostname !== self.location.hostname) {
    return;
  }

  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise try network
      return fetch(event.request)
        .then((fetchResponse) => {
          // Cache successful responses
          if (fetchResponse && fetchResponse.status === 200) {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return fetchResponse;
        })
        .catch(() => {
          // Offline fallback - return index.html for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          // For other requests, return empty response
          return new Response("", {
            status: 408,
            statusText: "Network unavailable - you are offline",
          });
        });
    })
  );
});
