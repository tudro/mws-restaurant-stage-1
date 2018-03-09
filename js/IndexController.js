import ToastsView from './views/Toasts.js';

export default function IndexController(container) {
  this._container = container;
  this._toastsView = new ToastsView(this._container);
  this._registerServiceWorker();
}

IndexController.prototype._registerServiceWorker = function() {
  var indexController = this;
  navigator.serviceWorker.register('sw.js').then(function(reg) {
    if(!navigator.serviceWorker.controller) {
      return;
    }
    console.log("Service Worker Registered");
    if (reg.waiting) {
      indexController._updateReady(reg.waiting);
    }

    if (reg.installing) {
      indexController._trackInstalling(reg.installing);
      return;
    }

    reg.addEventListener('updatefound', function() {
      indexController._trackInstalling(reg.installing);
    });

    var refreshing;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    })
  });
};

IndexController.prototype._trackInstalling = function(worker) {
  var indexController = this;

  worker.addEventListener('statechange', function() {
    if (worker.state == 'installed') {
      indexController._updateReady(worker);
    }
  });
};

IndexController.prototype._updateReady = function(worker) {
  var toast = this._toastsView.show("New version available", {
    buttons: ['refresh', 'dismiss']
  });

  toast.answer.then(function(answer) {
    if (answer != 'refresh') return;
    worker.postMessage({action: 'skipWaiting'});
  });
};