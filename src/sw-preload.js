import { ipcRenderer } from 'electron';

function forwardNotification(title, body) {
  ipcRenderer.send('notification:show', {
    title: String(title || ''),
    body: String(body || ''),
  });
}

function notificationStub(title, options = {}) {
  const stub = {
    close() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
    onclick: null,
    onshow: null,
    onerror: null,
    onclose: null,
    title: String(title || ''),
    body: String(options.body || ''),
    tag: options.tag || '',
    icon: options.icon || '',
    data: options.data || null,
  };

  queueMicrotask(() => {
    if (typeof stub.onshow === 'function') stub.onshow();
  });

  return stub;
}

if (typeof ServiceWorkerRegistration !== 'undefined') {
  const originalShow = ServiceWorkerRegistration.prototype.showNotification;
  ServiceWorkerRegistration.prototype.showNotification = function (title, options = {}) {
    forwardNotification(title, options.body || '');
    return Promise.resolve(notificationStub(title, options));
  };
}

if (typeof Notification !== 'undefined') {
  function PatchedNotification(title, options = {}) {
    forwardNotification(title, options.body || '');
    return notificationStub(title, options);
  }

  PatchedNotification.permission = 'granted';
  PatchedNotification.requestPermission = () => Promise.resolve('granted');
  PatchedNotification.maxActions = 0;

  globalThis.Notification = PatchedNotification;
}
