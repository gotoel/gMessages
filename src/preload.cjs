const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('__gmessages', {
  notify: (payload) => ipcRenderer.send('notification:show', payload),
  reportUnread: (count) => ipcRenderer.send('badge:update', count),
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

const injectUnreadWatcher = () => {
  const script = document.createElement('script');
  script.textContent = `
    (function () {
      if (window.__gmessagesUnreadWatcher) return;
      window.__gmessagesUnreadWatcher = true;

      let lastCount = -1;
      let timer = null;

      function detectUnreadCount() {
        const titleMatch = document.title.match(/^\\((\\d+)\\)/);
        if (titleMatch) return parseInt(titleMatch[1], 10);

        const ariaUnread = document.querySelectorAll(
          '[aria-label*="unread" i], [aria-label*="Unread" i]'
        );
        if (ariaUnread.length) return ariaUnread.length;

        const badges = document.querySelectorAll(
          'mw-conversation-list-item [class*="badge"], conversation-list-item [class*="badge"]'
        );
        let total = 0;
        badges.forEach((el) => {
          const n = parseInt(el.textContent.trim(), 10);
          total += Number.isNaN(n) ? 1 : n;
        });
        if (total) return total;

        const indicators = document.querySelectorAll(
          'mw-unread-indicator, [data-unread="true"], .unread-indicator'
        );
        if (indicators.length) return indicators.length;

        return 0;
      }

      function reportUnread() {
        const count = detectUnreadCount();
        if (count === lastCount) return;
        lastCount = count;
        if (window.__gmessages) {
          window.__gmessages.reportUnread(count);
        }
      }

      function scheduleReport() {
        clearTimeout(timer);
        timer = setTimeout(reportUnread, 300);
      }

      const titleEl = document.querySelector('title');
      if (titleEl) {
        new MutationObserver(scheduleReport).observe(titleEl, {
          childList: true,
          characterData: true,
          subtree: true,
        });
      }

      new MutationObserver(scheduleReport).observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-label', 'data-unread', 'class'],
      });

      setInterval(reportUnread, 15000);
      scheduleReport();
    })();
  `;
  document.documentElement.appendChild(script);
  script.remove();
};

const injectAll = () => {
  inject();
  injectUnreadWatcher();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectAll, { once: true });
} else {
  injectAll();
}
