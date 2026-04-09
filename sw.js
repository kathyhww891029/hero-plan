const CACHE_NAME = 'hero-plan-v76';  // ← 每次改动这里，强制刷新缓存
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './data.js?v=3',
  './hero-constants.js?v=5',
  './hero-state.js?v=5',
  './app.js?v=9',
  './firebase-sync.js?v=73',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './sounds/bonus.mp3',
  './sounds/celebration.mp3',
  './sounds/success.mp3',
  './sounds/ta-da.mp3'
];

// 安装 - 缓存所有文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('缓存文件中...');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// 激活 - 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
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
