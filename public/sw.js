// Keeps the app opening without a network (it then says the server is offline).
// Pages: network first, so a new version shows at once; the saved copy offline.
// Next's build files (_next/static/…) never change once built: cache first.
// Calls to Supabase and the WalkSafe server go to other addresses and are never cached.
const CACHE = "walksafe-v4";
const SCOPE = new URL(self.registration.scope).pathname;     // "/walksafe-app/" on GitHub Pages

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add(SCOPE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;

  if (url.pathname.startsWith(`${SCOPE}_next/static/`)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetchAndKeep(req)));
    return;
  }
  e.respondWith(
    fetchAndKeep(req).catch(async () =>
      (await caches.match(req, { ignoreSearch: true })) ||
      (req.mode === "navigate" ? caches.match(SCOPE) : Response.error())),
  );
});

async function fetchAndKeep(req) {
  const res = await fetch(req);
  if (res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
}
