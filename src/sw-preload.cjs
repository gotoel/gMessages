const { contextBridge, ipcRenderer } = require('electron');

function forwardNotification(title, options = {}) {
  const payload = {
    title: String(title || options.title || ''),
    body: String(options.body || options.message || ''),
  };

  ipcRenderer.invoke('notification:show', payload).catch(() => {
    ipcRenderer.send('notification:show', payload);
  });
}

contextBridge.exposeInMainWorld('__gmessagesBridge', {
  notify(title, options) {
    forwardNotification(title, options || {});
  },
});

contextBridge.executeInMainWorld({
  func: () => {
    if (globalThis.__gmessagesSWPatched) return;
    globalThis.__gmessagesSWPatched = true;

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

    function forward(title, options = {}) {
      const bridge = globalThis.__gmessagesBridge;
      if (bridge && typeof bridge.notify === 'function') {
        bridge.notify(title, options);
      }
    }

    function parsePushPayload(event) {
      let title = '';
      let body = '';

      if (!event.data) return { title, body };

      try {
        const payload = event.data.json();
        if (payload.notification) {
          title = payload.notification.title || '';
          body = payload.notification.body || '';
        }
        title = title || payload.title || '';
        body = body || payload.body || payload.message || '';
      } catch {
        try {
          body = event.data.text();
        } catch {
          // ignore
        }
      }

      return { title, body };
    }

    if (typeof self !== 'undefined' && typeof self.addEventListener === 'function') {
      self.addEventListener('push', (event) => {
        const { title, body } = parsePushPayload(event);
        if (title || body) {
          forward(title, { body });
        }
      });
    }

    if (typeof ServiceWorkerRegistration !== 'undefined') {
      ServiceWorkerRegistration.prototype.showNotification = function (title, options = {}) {
        forward(title, options);
        return Promise.resolve(notificationStub(title, options));
      };
    }

    if (typeof Notification !== 'undefined') {
      function PatchedNotification(title, options = {}) {
        forward(title, options);
        return notificationStub(title, options);
      }

      PatchedNotification.permission = 'granted';
      PatchedNotification.requestPermission = () => Promise.resolve('granted');
      PatchedNotification.maxActions = 0;

      globalThis.Notification = PatchedNotification;
    }
  },
});
