import { app, ipcMain, nativeImage } from 'electron';
import { getMainWindow } from './window.js';
import { updateTrayIcon } from './tray.js';

let unreadCount = 0;

export function registerBadgeHandlers() {
  ipcMain.on('badge:update', (_event, count) => {
    setUnreadCount(count);
  });
}

export function setUnreadCount(count) {
  const next = Math.max(0, Math.floor(Number(count) || 0));
  if (next === unreadCount) return;
  unreadCount = next;

  if (process.platform === 'darwin' || process.platform === 'linux') {
    app.setBadgeCount(next);
  }

  const win = getMainWindow();
  if (win && !win.isDestroyed() && process.platform === 'win32') {
    win.setOverlayIcon(next > 0 ? createBadgeOverlay(next) : null, `${next} unread`);
  }

  updateTrayIcon(next);
}

function createBadgeOverlay(count) {
  const text = count > 99 ? '99+' : String(count);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
    <circle cx="8" cy="8" r="8" fill="#ea4335"/>
    <text x="8" y="12" text-anchor="middle" fill="white" font-size="10" font-family="Segoe UI, Arial, sans-serif" font-weight="600">${text}</text>
  </svg>`;

  return nativeImage.createFromDataURL(
    `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  );
}
