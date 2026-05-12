// SW v120 自毁升级版 — 清除所有缓存 → 卸载自身 → 强制刷新 → 加载 v121
self.addEventListener('install', (event) => {
  console.log('SW v120 升级版 - 跳过等待…');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW v120 升级版 - 清除缓存并自毁…');
  event.waitUntil(
    caches.keys()
      .then(names => {
        console.log('删除缓存:', names);
        return Promise.all(names.map(n => caches.delete(n)));
      })
      .then(() => self.registration.unregister())
      .then(() => {
        console.log('SW 已卸载，强制刷新所有窗口…');
        return self.clients.matchAll().then(clients =>
          clients.forEach(client => client.navigate(client.url))
        );
      })
  );
});

self.addEventListener('fetch', (event) => {
  // 直通网络，不做任何缓存
  event.respondWith(fetch(event.request));
});
