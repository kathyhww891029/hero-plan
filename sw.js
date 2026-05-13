/* ══════════════════════════════════════════════════════════════
   英雄成长计划 · Service Worker
   策略：index.html 网络优先（保证 PWA 始终获取最新版本）
         JS/CSS 缓存优先（query string 版本控制）
══════════════════════════════════════════════════════════════ */
const CACHE_NAME = 'hero-plan-v112';
const CACHE_DATE = '2026-05-13-v26';

// 核心资源（按需缓存）
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './data.js?v=3c',
  './hero-constants.js?v=5f',
  './hero-state.js?v=13f',
  './app.js?v=27',
  './firebase-sync.js?v=77f',
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
      console.log('🦸 SW v110 安装中…');
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('⚠️ 部分资源缓存失败（非致命）:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('🗑️ 清除旧缓存:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_VERSION',
            cacheName: CACHE_NAME,
            cacheDate: CACHE_DATE,
            action: 'reload'
          });
        });
      });
    })
  );
  self.clients.claim();
});

// 拦截请求：index.html 网络优先，其他缓存优先
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // index.html 和根路径：网络优先（保证 PWA 始终拿到最新版）
  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 其他资源：缓存优先 + 后台更新
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        // stale-while-revalidate
        fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
