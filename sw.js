const CACHE_NAME = 'hero-plan-v95';  // ← 每次改动这里，强制刷新缓存
const CACHE_DATE = '2026-04-23-debug';

const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './data.js?v=3c',
  './hero-constants.js?v=5c',
  './hero-state.js?v=12c',
  './app.js?v=14c',
  './firebase-sync.js?v=76c',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './sounds/bonus.mp3',
  './sounds/celebration.mp3',
  './sounds/success.mp3',
  './sounds/ta-da.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW 缓存文件中...', CACHE_NAME);
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => {
      // 通知所有客户端 SW 版本信息
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_VERSION',
            cacheName: CACHE_NAME,
            cacheDate: CACHE_DATE
          });
        });
      });
    })
  );
  self.clients.claim();
});

// 拦截请求 - 网络优先，离线降级缓存
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      if (!response || response.status !== 200) return response;
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, responseClone);
      });
      return response;
    }).catch(() => {
      return caches.match(event.request).then(r => r || caches.match('./index.html'));
    })
  );
});