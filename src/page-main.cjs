const { ipcRenderer } = require('electron');

function forwardNotification(title, body) {
  ipcRenderer.send('notification:show', {
    title: String(title || ''),
    body: String(body || ''),
  });
}

function reportUnread(count) {
  ipcRenderer.send('badge:update', count);
}

function patchNotification() {
  if (globalThis.__gmessagesNotificationPatched) return;
  globalThis.__gmessagesNotificationPatched = true;

  const OriginalNotification = globalThis.Notification;

  function PatchedNotification(title, options = {}) {
    forwardNotification(title, options.body || '');

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

  PatchedNotification.permission = 'granted';
  PatchedNotification.requestPermission = () => Promise.resolve('granted');

  if (OriginalNotification) {
    Object.defineProperty(PatchedNotification, 'maxActions', {
      get: () => OriginalNotification.maxActions,
    });
  }

  globalThis.Notification = PatchedNotification;
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

patchNotification();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startUnreadWatcher, { once: true });
} else {
  startUnreadWatcher();
}
