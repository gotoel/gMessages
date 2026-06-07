import { Tray, Menu, nativeImage } from 'electron';
import { getAppIconPath } from './app-icon.js';
import { getSetting } from './settings.js';

const TRAY_SIZE = 16;

let tray = null;
let baseTrayIcon = null;
let trayContextMenu = null;
let trayOnShow = null;
let trayClickHandler = null;
let trayDoubleClickHandler = null;

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

function usesDoubleClick() {
  return Number(getSetting('trayOpenClickCount')) >= 2;
}

function bindTrayOpenBehavior() {
  if (!tray || !trayOnShow) return;

  if (trayClickHandler) {
    tray.removeListener('click', trayClickHandler);
    trayClickHandler = null;
  }
  if (trayDoubleClickHandler) {
    tray.removeListener('double-click', trayDoubleClickHandler);
    trayDoubleClickHandler = null;
  }

  if (usesDoubleClick()) {
    trayDoubleClickHandler = trayOnShow;
    tray.on('double-click', trayDoubleClickHandler);
  } else {
    trayClickHandler = trayOnShow;
    tray.on('click', trayClickHandler);
  }
}

export function applyTrayClickBehavior() {
  bindTrayOpenBehavior();
}

export function createTray({ onShow, onSettings, onGoogleSettings, onQuit }) {
  tray = new Tray(createTrayIcon(false));
  trayOnShow = onShow;

  tray.setToolTip('gMessages');

  trayContextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Messages',
      click: onShow,
    },
    {
      label: 'Google Settings',
      click: onGoogleSettings,
    },
    {
      label: 'gMessages Settings',
      click: onSettings,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: onQuit,
    },
  ]);

  if (process.platform === 'win32') {
    // Left-click opens the app; right-click opens the menu. setContextMenu on
    // Windows steals left-click and only opens the menu.
    tray.on('right-click', () => tray.popUpContextMenu(trayContextMenu));
  } else {
    tray.setContextMenu(trayContextMenu);
  }

  bindTrayOpenBehavior();

  return tray;
}

export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
  trayContextMenu = null;
  trayOnShow = null;
  trayClickHandler = null;
  trayDoubleClickHandler = null;
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
