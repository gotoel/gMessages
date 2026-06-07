import { Notification, ipcMain, nativeImage } from 'electron';
import { getSetting } from './settings.js';
import { showMainWindow } from './window.js';
import { getAppIconPath } from './app-icon.js';

const icon = nativeImage.createFromPath(getAppIconPath());

export function initNotifications() {
  if (!Notification.isSupported()) {
    console.warn('Native notifications are not supported on this system.');
  }
}

export function registerNotificationHandlers() {
  ipcMain.on('notification:show', (_event, payload) => {
    showNativeNotification(payload);
  });
}

function showNativeNotification({ title = '', body = '' }) {
  if (!Notification.isSupported()) return;

  const privacy = getSetting('notificationPrivacy');
  const { notifTitle, notifBody } = formatNotification(title, body, privacy);

  const notification = new Notification({
    title: notifTitle,
    body: notifBody,
    icon,
    silent: false,
  });

  notification.on('click', () => {
    showMainWindow();
  });

  notification.show();
}

function formatNotification(title, body, privacy) {
  switch (privacy) {
    case 'private':
      return { notifTitle: title || 'gMessages', notifBody: '' };
    case 'minimal':
      return { notifTitle: 'gMessages', notifBody: 'New message' };
    case 'full':
    default:
      return { notifTitle: title || 'gMessages', notifBody: body };
  }
}
