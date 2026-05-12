self.addEventListener('install', (event) => {
  console.log('SW v121 安装中…');
  const CACHE_NAME = 'hero-plan-v121';
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './app.js?v=24',
        './manifest.json',
        './icon-192.png',
        './icon-512.png'
      ]);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('SW v121 激活中…');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== 'hero-plan-v121').map(name => {
          console.log('删除旧缓存:', name);
          return caches.delete(name);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
