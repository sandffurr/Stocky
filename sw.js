const CACHE = 'stocky-v10';
const SHELL = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.hostname.endsWith('firebaseio.com') || u.hostname.endsWith('googleapis.com')) return;
  // stale-while-revalidate: เปิดไว (จาก cache) แล้วอัปเดตเบื้องหลัง
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(r, {ignoreSearch: r.mode === 'navigate'});
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
