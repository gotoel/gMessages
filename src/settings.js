import { app, BrowserWindow, ipcMain } from 'electron';
import Store from 'electron-store';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

export const SETTING_DEFS = {
  notificationPrivacy: {
    label: 'Notification privacy',
    description: 'Control how much message content appears in notifications.',
    default: 'full',
    type: 'select',
    options: [
      { value: 'full', label: 'Full — sender and message preview' },
      { value: 'private', label: 'Private — sender name only' },
      { value: 'minimal', label: 'Minimal — "New message" only' },
    ],
  },
  launchAtStartup: {
    label: 'Launch at startup',
    description: 'Open gMessages when you sign in to Windows.',
    default: false,
    type: 'toggle',
  },
  startMinimized: {
    label: 'Start minimized to tray',
    description: 'Skip the main window on launch and stay in the system tray.',
    default: false,
    type: 'toggle',
  },
};

const defaults = Object.fromEntries(
  Object.entries(SETTING_DEFS).map(([key, def]) => [key, def.default])
);

defaults.windowBounds = { width: 1200, height: 800 };

let store;
let settingsWindow = null;

export function initSettings() {
  store = new Store({ defaults });
}

export function getStore() {
  return store;
}

export function getSetting(key) {
  return store.get(key);
}

export function setSetting(key, value) {
  store.set(key, value);
  if (key === 'launchAtStartup' || key === 'startMinimized') {
    applyLaunchAtStartup();
  }
}

export function getAllSettings() {
  return Object.fromEntries(
    Object.keys(SETTING_DEFS).map((key) => [key, store.get(key)])
  );
}

export function getSettingDefs() {
  return SETTING_DEFS;
}

export function applyLaunchAtStartup(enabled = store.get('launchAtStartup')) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: store.get('startMinimized'),
  });
}

export function openSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return settingsWindow;
  }

  settingsWindow = new BrowserWindow({
    width: 460,
    height: 560,
    useContentSize: true,
    resizable: true,
    minWidth: 400,
    minHeight: 400,
    title: 'gMessages Settings',
    autoHideMenuBar: true,
    icon: path.join(ROOT, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'settings-preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.loadFile(path.join(ROOT, 'ui', 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  return settingsWindow;
}

export function registerSettingsHandlers() {
  ipcMain.handle('settings:getAll', () => ({
    settings: getAllSettings(),
    defs: getSettingDefs(),
  }));

  ipcMain.handle('settings:set', (_event, key, value) => {
    if (!(key in SETTING_DEFS)) {
      throw new Error(`Unknown setting: ${key}`);
    }
    setSetting(key, value);
    return getAllSettings();
  });
}
