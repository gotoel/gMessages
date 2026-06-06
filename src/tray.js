import { app, Tray, Menu, nativeImage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

let tray = null;

export function createTray({ onShow, onSettings, onQuit }) {
  const iconPath = path.join(ROOT, 'assets', 'icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

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
