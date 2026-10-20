// 학교 와이파이가 끊겨도 앱이 열리도록 한 번 받은 파일을 기기에 보관한다.
// 화면(index.html)은 항상 새로 받아 보고, 안 되면 보관본을 쓴다. 해시가 붙은 파일은 보관본 먼저.
const CACHE = 'little-star-v2';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './manifest.webmanifest', './icons/icon-192.png'])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const put = (req, res) => {
  if (res && res.ok && res.status === 200) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return; // 음악 부분 요청은 그대로 보낸다
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return; // 학급 서버(Firebase)는 건드리지 않는다
  if (url.pathname.startsWith('/__/')) return; // Google 로그인 창(Firebase 로그인 중계)도 그대로 보낸다

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => put('./', res))
        .catch(() => caches.match('./')),
    );
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => put(req, res))));
});
