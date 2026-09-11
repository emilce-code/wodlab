const VERSION = "wodly-v2";
const PAGE_CACHE = `${VERSION}-pages`;
const ASSET_CACHE = `${VERSION}-assets`;
const DATABASE = "wodly-offline";
const STORE = "result-queue";
const OFFLINE_PAGES = ["/en/offline", "/es/offline", "/pt/offline"];
const PRECACHE = [
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  ...OFFLINE_PAGES,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(ASSET_CACHE).then((cache) => cache.addAll(PRECACHE)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => !key.startsWith(VERSION))
              .map((key) => caches.delete(key)),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});

function openQueue() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, action) {
  const database = await openQueue();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, mode);
    const result = action(transaction.objectStore(STORE));
    transaction.oncomplete = () => {
      database.close();
      resolve(result);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

async function queueRequest(request) {
  const body = await request.clone().text();
  const entry = {
    id: crypto.randomUUID(),
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body,
    createdAt: new Date().toISOString(),
  };
  await withStore("readwrite", (store) => store.put(entry));
  if (self.registration.sync)
    await self.registration.sync.register("wodly-result-sync");
  return entry.id;
}

async function entries() {
  const database = await openQueue();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE).objectStore(STORE).getAll();
    request.onsuccess = () => {
      database.close();
      resolve(request.result);
    };
    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}

async function flushQueue() {
  for (const entry of await entries()) {
    try {
      const response = await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: entry.body,
        credentials: "include",
      });
      if (!response.ok && response.status < 500) {
        await withStore("readwrite", (store) => store.delete(entry.id));
        await notifyClients("RESULT_SYNC_FAILED", entry.id);
      } else if (response.ok) {
        await withStore("readwrite", (store) => store.delete(entry.id));
        await notifyClients("RESULT_SYNCED", entry.id);
      }
    } catch {
      return;
    }
  }
}

async function notifyClients(type, id) {
  for (const client of await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  }))
    client.postMessage({ type, id });
}

function isResultCreate(request, url) {
  return (
    request.method === "POST" &&
    /^\/api\/(workouts|movements)\/[^/]+\/results$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isResultCreate(event.request, url)) {
    event.respondWith(
      fetch(event.request.clone()).catch(async () => {
        const queueId = await queueRequest(event.request);
        return new Response(
          JSON.stringify({ queued: true, offline: true, queueId }),
          { status: 202, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok && !url.pathname.includes("/login")) {
            const responseForCache = response.clone();
            event.waitUntil(
              caches
                .open(PAGE_CACHE)
                .then((cache) => cache.put(event.request, responseForCache)),
            );
          }
          return response;
        })
        .catch(
          async () =>
            (await caches.match(event.request)) ||
            caches.match(`/${url.pathname.split("/")[1] || "en"}/offline`),
        ),
    );
    return;
  }

  if (
    event.request.method === "GET" &&
    (url.pathname.startsWith("/_next/static/") ||
      /\.(png|svg|ico|woff2)$/.test(url.pathname))
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const responseForCache = response.clone();
              event.waitUntil(
                caches
                  .open(ASSET_CACHE)
                  .then((cache) => cache.put(event.request, responseForCache)),
              );
            }
            return response;
          }),
      ),
    );
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "wodly-result-sync") event.waitUntil(flushQueue());
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "FLUSH_QUEUE") event.waitUntil(flushQueue());
  if (event.data?.type === "CLEAR_PRIVATE_DATA")
    event.waitUntil(
      Promise.all([
        caches.delete(PAGE_CACHE),
        withStore("readwrite", (store) => store.clear()),
      ]),
    );
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
