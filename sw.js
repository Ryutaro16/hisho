// 秘書アプリの画面を端末の中に控えて、開いた瞬間に出す(2026-11-26)。
// 開くときは控えをすぐ出し、裏で最新を取りに行って控えを新しくする(次に開いたときに新しい版になる)。
// 「?v=」付き(アプリが新しい版があると気づいて読み直したとき)は、最新を先に取りに行く。
// この住所(/hisho/)の中の画面とアイコンだけ。中継サーバーなど別の住所への通信には触らない
const CACHE = "hisho-app-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

async function fromNet(url, key) {
  const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
  if (res.ok && !res.redirected) { const c = await caches.open(CACHE); await c.put(key, res.clone()); }
  return res;
}
self.addEventListener("fetch", (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  const isPage = req.mode === "navigate";
  if (!isPage && !/\.(png|svg)$/.test(url.pathname)) return; // 版の確かめ(checkUpdate)などは今までどおり
  const key = url.origin + url.pathname; // ?v= などは外して1つにする
  const net = fromNet(url.origin + url.pathname, key);
  if (isPage && url.searchParams.has("v")) {
    e.respondWith(net.catch(() => caches.match(key).then((r) => r || Response.error())));
    return;
  }
  e.respondWith(caches.match(key).then((hit) => {
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  }));
});
