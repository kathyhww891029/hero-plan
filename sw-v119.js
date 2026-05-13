self.addEventListener('install', (event) => {
  console.log('SW v119 安装中…');
  const CACHE_NAME = 'hero-plan-v119';
  const CACHE_DATE = '2026-05-13-selfreport-diag';
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './app.js?v=22',
        './manifest.json',
        './icon-192.png',
        './icon-512.png'
      ]);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('SW v119 激活中…');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== 'hero-plan-v119').map(name => {
          console.log('删除旧缓存:', name);
          return caches.delete(name);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
