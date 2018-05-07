let staticCacheName = 'mws-rest-v25';
let contentImgsCache = 'mws-rest-imgs';
let allCaches = [
  staticCacheName,
  contentImgsCache
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        './',
        './css/styles.css',
        './css/styles_medium.css',
        './css/styles_small.css',
        './js/dbhelper.js',
        './js/main.js',
        './js/restaurant_info.js',
        './js/index.js',
        './js/IndexController.js',
        './js/utils/idb.js',
        './js/utils/closest.js',
        './js/utils/handlebars.min.js',
        './js/utils/matches-selector.js',
        './js/utils/parseHTML.js',
        './js/utils/simple-transition.js',
        './js/utils/focus-visible.js',
        './js/views/Toasts.js',
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
          return cacheName.startsWith('mws-rest-') && !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  let requestUrl = new URL(event.request.url);
  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname.startsWith('/images/')) {
      event.respondWith(servePhoto(event.request));
      return;
    } else if (requestUrl.pathname.includes('.html')) {
      event.respondWith(servePage(event.request));
      return;
    }

  }
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});

function servePhoto(request) {
  var storageUrl = request.url.replace(/_\d+x\.webp$/, '');

  return caches.open(contentImgsCache).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

function servePage(request) {

  return caches.open(staticCacheName).then(function(cache) {
    return cache.match(request.url).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(request.url, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

self.addEventListener('message', function(event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
