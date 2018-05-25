import parseHTML from './../utils/parseHTML.js';
import transition from './../utils/simple-transition.js';
import closest from './../utils/closest.js';
import Handlebars from './../utils/handlebars-v4.0.11';

function Toast(text, duration, buttons) {
  var toast = this;
  var toastTemplate = '<div class="toast">\n' +
    '  <div class="toast-content">{{text}}</div>\n' +
    '  {{#each buttons}}<button class="unbutton">{{.}}</button>{{/each}}\n' +
    '</div>';
  var template = Handlebars.compile(toastTemplate);
  this.container = parseHTML(template({
    text: text,
    buttons: buttons
  })).firstChild;

  this.answer = new Promise(function(resolve) {
    toast._answerResolver = resolve;
  });

  this.gone = new Promise(function(resolve) {
    toast._goneResolver = resolve;
  });

  if (duration) {
    this._hideTimeout = setTimeout(function() {
      toast.hide();
    }, duration);
  }

  this.container.addEventListener('click', function(event) {
    var button = closest(event.target, 'button', true);
    if (!button) return;
    toast._answerResolver(button.textContent);
    toast.hide();
  });
}

Toast.prototype.hide = function() {
  clearTimeout(this._hideTimeout);
  this._answerResolver();

  transition(this.container, {
    opacity: 0
  }, 0.3, 'ease-out').then(this._goneResolver);
  
  return this.gone;
};

export default function Toasts(appendToEl) {
  this._container = parseHTML('<div class="toasts"></div>').firstChild;
  appendToEl.appendChild(this._container);
}

// show a message to the user eg:
// toasts.show("Do you wish to continue?", {
//   buttons: ['yes', 'no']
// })
// Returns a toast.
Toasts.prototype.show = function(message, opts) {
  // opts = defaults({}, opts, {
  //   duration: 0,
  //   buttons: ['dismiss']
  // });

  var toast = new Toast(message, opts.duration, opts.buttons);
  this._container.appendChild(toast.container);

  transition(toast.container, {
    opacity: 1
  }, 0.5, 'ease-out');

  toast.gone.then(function() {
    toast.container.parentNode.removeChild(toast.container);
  });

  return toast;
};