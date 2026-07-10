const CACHE_NAME = "water-monitor-v2";
const LOCAL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js",
  "./assets/css/styles.css",
  "./assets/js/scripts.js",
  "./assets/js/firebase-config.js",
  "./assets/img/icon192_maskable.png",
  "./assets/img/icon192_rounded.png",
  "./assets/img/icon512_maskable.png",
  "./assets/img/icon512_rounded.png",
];

const CDN_ASSETS = [
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js",
  "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of LOCAL_ASSETS) {
        try { await cache.add(url); } catch {}
      }
      for (const url of CDN_ASSETS) {
        try { await cache.add(url); } catch {}
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith("http")) return;

  const isCDN = !event.request.url.startsWith(self.location.origin);

  event.respondWith(
    (isCDN ? networkFirst(event) : cacheFirst(event))
  );
});

async function cacheFirst(event) {
  const cached = await caches.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (response && response.status === 200) {
    const clone = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
  }
  return response;
}

async function networkFirst(event) {
  try {
    const response = await fetch(event.request);
    if (response && response.status === 200) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
    }
    return response;
  } catch {
    const cached = await caches.match(event.request);
    return cached || new Response("Offline", { status: 503 });
  }
}
