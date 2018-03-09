var staticCacheName = 'mws-rest-v25';
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        '/offlineIndex.html',
        '/css/styles.css',
        '/css/styles_medium.css',
        '/css/styles_small.css',
        '/js/dbhelper.js',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/js/index.js',
        '/js/IndexController.js',
        '/js/utils/closest.js',
        '/js/utils/handlebars-latest.js',
        '/js/utils/matches-selector.js',
        '/js/utils/parseHTML.js',
        '/js/utils/simple-transition.js',
        '/js/views/Toasts.js',
        '/data/restaurants.json',
        'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
        'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxK.woff2',
        'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4.woff2'
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('mws-rest-') && cacheName != staticCacheName;
        }).map(function(cacheName) {
          return caches.delete(cacheNames);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);
  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('offlineIndex.html'));
      return;
    }
  }
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data.action == 'skipWaiting') {
    self.skipWaiting();
  }
});
