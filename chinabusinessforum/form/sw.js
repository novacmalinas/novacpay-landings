/* Офлайн-режим анкеты: страница, стили, шрифт и библиотека QR берутся из кэша, если нет сети.
   Страница — сначала из сети (чтобы обновления доходили), при ошибке — из кэша.
   Запросы в Google-таблицу (POST) не трогаем: их отправляет очередь на странице. */
var CACHE = 'cbf26-form-v1';
var CORE = ['./', '../style.css', 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(CORE.map(function(u){ return c.add(u).catch(function(){}); }));
  }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k.indexOf('cbf26-form-') === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  var mine = u.origin === location.origin;
  var lib = /cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(u.host);
  if (!mine && !lib) return;
  if (r.mode === 'navigate' || (mine && /\.(html|css)$|\/$/.test(u.pathname))) {
    e.respondWith(fetch(r).then(function(res){
      var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(r.mode === 'navigate' ? './' : r, copy); });
      return res;
    }).catch(function(){
      return caches.match(r.mode === 'navigate' ? './' : r, { ignoreSearch: true });
    }));
    return;
  }
  e.respondWith(caches.match(r).then(function(hit){
    return hit || fetch(r).then(function(res){
      var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(r, copy); });
      return res;
    });
  }));
});
