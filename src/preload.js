import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('__gmessages', {
  notify: (payload) => ipcRenderer.send('notification:show', payload),
});

const inject = () => {
  const script = document.createElement('script');
  script.textContent = `
    (function () {
      if (window.__gmessagesPatched) return;
      window.__gmessagesPatched = true;

      const OriginalNotification = window.Notification;

      function PatchedNotification(title, options) {
        options = options || {};
        const body = options.body || '';

        if (window.__gmessages) {
          window.__gmessages.notify({ title: String(title || ''), body: String(body) });
        }

        const stub = {
          close() {},
          addEventListener() {},
          removeEventListener() {},
          dispatchEvent() { return false; },
          onclick: null,
          onshow: null,
          onerror: null,
          onclose: null,
          title: String(title || ''),
          body: String(body),
          tag: options.tag || '',
          icon: options.icon || '',
          data: options.data || null,
        };

        queueMicrotask(() => {
          if (typeof stub.onshow === 'function') stub.onshow();
        });

        return stub;
      }

      PatchedNotification.permission = 'granted';
      PatchedNotification.requestPermission = () => Promise.resolve('granted');

      Object.defineProperty(PatchedNotification, 'maxActions', {
        get: () => OriginalNotification.maxActions,
      });

      window.Notification = PatchedNotification;
    })();
  `;
  document.documentElement.appendChild(script);
  script.remove();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inject, { once: true });
} else {
  inject();
}
