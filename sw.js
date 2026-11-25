const CACHE = 'stocky-v12';
const SHELL = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];
// ไลบรารีจาก CDN: แคชไว้ตั้งแต่ติดตั้ง เพื่อให้เปิดออฟไลน์ได้ตั้งแต่ครั้งแรก
// (ถ้า URL/เวอร์ชันไม่ตรงกับใน index.html จะไม่เสียหาย แค่ไม่ได้ precache)
const CDN = [
  'https://cdn.tailwindcss.com/3.4.17',
  'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/module.esm.min.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js'
];
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(SHELL);
    await Promise.allSettled(CDN.map(async u => { const res = await fetch(u); if (res.ok) await c.put(u, res); }));
    await self.skipWaiting();
  })());
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
    const net = fetch(r)
      .then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()); return res; })
      .catch(async () => hit || (r.mode === 'navigate' && await c.match('./index.html')) || Response.error());
    return hit || net;
  }));
});
