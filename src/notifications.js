import { Notification, ipcMain, nativeImage, session } from 'electron';
import { showMainWindow } from './window.js';
import { getAppIconPath } from './app-icon.js';

let icon = null;
const bridgedWorkers = new WeakSet();
let lastNotification = { title: '', body: '', at: 0 };

function getIcon() {
  if (!icon) {
    icon = nativeImage.createFromPath(getAppIconPath());
  }
  return icon;
}

export function initNotifications() {
  if (!Notification.isSupported()) {
    console.warn('Native notifications are not supported on this system.');
  }
}

function handleNotificationPayload(payload) {
  showNativeNotification(payload ?? {});
}

export function registerNotificationHandlers() {
  ipcMain.on('notification:show', (_event, payload) => {
    handleNotificationPayload(payload);
  });
}

export function registerServiceWorkerNotificationBridge(partition = 'persist:gmessages') {
  const ses = session.fromPartition(partition);
  const { serviceWorkers } = ses;

  const attachBridge = (versionId) => {
    const id = Number(versionId);
    if (!Number.isFinite(id)) return;

    let sw;
    try {
      sw = serviceWorkers.getWorkerFromVersionID(id);
    } catch {
      return;
    }
    if (!sw || bridgedWorkers.has(sw) || !sw.ipc) return;
    bridgedWorkers.add(sw);

    try {
      sw.ipc.handle('notification:show', (_event, payload) => {
        handleNotificationPayload(payload);
        return true;
      });
    } catch (err) {
      bridgedWorkers.delete(sw);
      console.warn('Could not attach service worker notification bridge:', err);
    }
  };

  const attachAllRunning = () => {
    let running;
    try {
      running = serviceWorkers.getAllRunning();
    } catch {
      return;
    }

    for (const [versionId, info] of Object.entries(running)) {
      attachBridge(info?.versionId ?? versionId);
    }
  };

  serviceWorkers.on('running-status-changed', (details) => {
    if (details.runningStatus === 'running') {
      attachBridge(details.versionId);
    }
  });

  attachAllRunning();
}

function showNativeNotification({ title = '', body = '' }) {
  if (!Notification.isSupported()) return;

  try {
    const safeTitle = String(title || '').trim();
    const safeBody = String(body || '').trim();
    const now = Date.now();
    if (
      lastNotification.title === safeTitle &&
      lastNotification.body === safeBody &&
      now - lastNotification.at < 2000
    ) {
      return;
    }
    lastNotification = { title: safeTitle, body: safeBody, at: now };

    const appIcon = getIcon();
    const notification = new Notification({
      title: safeTitle || 'gMessages',
      body: safeBody,
      icon: appIcon.isEmpty() ? undefined : appIcon,
      silent: false,
    });

    notification.on('click', () => {
      showMainWindow();
    });

    notification.show();
  } catch (err) {
    console.warn('Failed to show native notification:', err);
  }
}
