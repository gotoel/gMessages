const { ipcRenderer } = require('electron');

function forwardNotification(title, options = {}) {
  const payload = {
    title: String(title || options.title || ''),
    body: String(options.body || options.message || ''),
  };

  ipcRenderer.send('notification:show', payload);
}

function reportUnread(count) {
  ipcRenderer.send('badge:update', count);
}

function createNotificationStub(title, options = {}) {
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

function patchPermissionsQuery() {
  if (!navigator.permissions || globalThis.__gmessagesPermsPatched) return;
  globalThis.__gmessagesPermsPatched = true;

  const originalQuery = navigator.permissions.query.bind(navigator.permissions);
  navigator.permissions.query = (description) => {
    const name = typeof description === 'string' ? description : description?.name;
    if (name === 'notifications') {
      return Promise.resolve({ state: 'granted', onchange: null });
    }
    return originalQuery(description);
  };
}

function patchNotification() {
  if (globalThis.__gmessagesNotificationPatched) return;
  if (typeof globalThis.Notification === 'undefined') return;
  globalThis.__gmessagesNotificationPatched = true;

  const OriginalNotification = globalThis.Notification;

  function PatchedNotification(title, options = {}) {
    forwardNotification(title, options);
    return createNotificationStub(title, options);
  }

  PatchedNotification.permission = 'granted';
  PatchedNotification.requestPermission = () => Promise.resolve('granted');

  if (OriginalNotification) {
    Object.defineProperty(PatchedNotification, 'maxActions', {
      get: () => OriginalNotification.maxActions,
    });
  }

  globalThis.Notification = PatchedNotification;
}

function patchServiceWorkerNotifications() {
  if (globalThis.__gmessagesSWShowPatched) return;
  if (typeof ServiceWorkerRegistration === 'undefined') return;
  globalThis.__gmessagesSWShowPatched = true;

  ServiceWorkerRegistration.prototype.showNotification = function (title, options = {}) {
    forwardNotification(title, options);
    return Promise.resolve(createNotificationStub(title, options));
  };
}

function applyNotificationPatches() {
  patchPermissionsQuery();
  patchNotification();
  patchServiceWorkerNotifications();
}

function scheduleNotificationPatches(attempt = 0) {
  applyNotificationPatches();
  if (globalThis.__gmessagesSWShowPatched || attempt >= 40) return;
  setTimeout(() => scheduleNotificationPatches(attempt + 1), 250);
}

function detectUnreadCount() {
  const title = document.title || '';
  const parenMatch = title.match(/\((\d+)\)/);
  if (parenMatch) return parseInt(parenMatch[1], 10);

  const unreadTitleMatch = title.match(/(\d+)\s+unread/i);
  if (unreadTitleMatch) return parseInt(unreadTitleMatch[1], 10);

  const ariaUnread = document.querySelectorAll(
    '[aria-label*="unread" i], [aria-label*="Unread" i]'
  );
  if (ariaUnread.length) return ariaUnread.length;

  const badges = document.querySelectorAll(
    'mw-conversation-list-item [class*="badge"], conversation-list-item [class*="badge"], [class*="unread-count"], [class*="UnreadCount"]'
  );
  let total = 0;
  badges.forEach((el) => {
    const n = parseInt(el.textContent.trim(), 10);
    total += Number.isNaN(n) ? 1 : n;
  });
  if (total) return total;

  const indicators = document.querySelectorAll(
    'mw-unread-indicator, [data-unread="true"], .unread-indicator, [aria-label*="unread message" i]'
  );
  if (indicators.length) return indicators.length;

  return 0;
}

function startUnreadWatcher() {
  if (globalThis.__gmessagesUnreadWatcher) return;
  globalThis.__gmessagesUnreadWatcher = true;

  let lastCount = -1;
  let timer = null;

  function publishUnread() {
    const count = detectUnreadCount();
    if (count === lastCount) return;
    lastCount = count;
    reportUnread(count);
  }

  function schedulePublish() {
    clearTimeout(timer);
    timer = setTimeout(publishUnread, 300);
  }

  const titleEl = document.querySelector('title');
  if (titleEl) {
    new MutationObserver(schedulePublish).observe(titleEl, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  new MutationObserver(schedulePublish).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-label', 'data-unread', 'class'],
  });

  setInterval(publishUnread, 15000);
  schedulePublish();
}

scheduleNotificationPatches();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    applyNotificationPatches();
    startUnreadWatcher();
  }, { once: true });
} else {
  applyNotificationPatches();
  startUnreadWatcher();
}

if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener('controllerchange', applyNotificationPatches);
}
