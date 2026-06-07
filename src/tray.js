import { Tray, Menu, nativeImage } from 'electron';
import { getAppIconPath } from './app-icon.js';

const TRAY_SIZE = 16;

let tray = null;
let baseTrayIcon = null;

function getBaseTrayIcon() {
  if (!baseTrayIcon || baseTrayIcon.isEmpty()) {
    const iconPath = getAppIconPath();
    baseTrayIcon = nativeImage.createFromPath(iconPath).resize({
      width: TRAY_SIZE,
      height: TRAY_SIZE,
    });

    if (baseTrayIcon.isEmpty()) {
      console.warn('Tray icon could not be loaded from', iconPath);
    }
  }
  return baseTrayIcon;
}

function drawUnreadDot(bitmap, width, height) {
  const cx = 12;
  const cy = 4;
  const radius = 3.5;
  const radiusSq = radius * radius;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const distSq = dx * dx + dy * dy;
      if (distSq > radiusSq) continue;

      const offset = (y * width + x) * 4;
      const edge = radius - Math.sqrt(distSq);
      const alpha = edge < 1 ? Math.min(1, Math.max(0, edge)) : 1;
      const border = distSq > (radius - 0.75) * (radius - 0.75);

      if (border) {
        bitmap[offset] = 255;
        bitmap[offset + 1] = 255;
        bitmap[offset + 2] = 255;
        bitmap[offset + 3] = Math.round(255 * alpha);
      } else {
        bitmap[offset] = 53;
        bitmap[offset + 1] = 67;
        bitmap[offset + 2] = 229;
        bitmap[offset + 3] = Math.round(255 * alpha);
      }
    }
  }
}

export function createTrayIcon(hasUnread = false) {
  const base = getBaseTrayIcon();
  if (!base || base.isEmpty()) return base;
  if (!hasUnread) return base;

  const { width, height } = base.getSize();
  const bitmap = Buffer.from(base.toBitmap());
  drawUnreadDot(bitmap, width, height);
  return nativeImage.createFromBitmap(bitmap, { width, height });
}

export function createTray({ onShow, onSettings, onQuit }) {
  tray = new Tray(createTrayIcon(false));

  tray.setToolTip('gMessages');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show gMessages',
      click: onShow,
    },
    {
      label: 'Settings',
      click: onSettings,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: onQuit,
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', onShow);

  return tray;
}

export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

export function getTray() {
  return tray;
}

export function updateTrayTooltip(unreadCount = 0) {
  if (!tray) return;
  const tip = unreadCount > 0 ? `gMessages (${unreadCount} unread)` : 'gMessages';
  tray.setToolTip(tip);
}

export function updateTrayIcon(unreadCount = 0) {
  if (!tray) return;
  tray.setImage(createTrayIcon(unreadCount > 0));
  updateTrayTooltip(unreadCount);
}
