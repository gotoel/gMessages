import { app, BrowserWindow, ipcMain } from 'electron';
import Store from 'electron-store';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

let trayBehaviorApplier = null;

export const SETTING_DEFS = {
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
  trayOpenClickCount: {
    label: 'Tray icon clicks to open',
    description: 'How many times to click the tray icon to show gMessages.',
    default: 1,
    type: 'select',
    options: [
      { value: 1, label: 'Single click' },
      { value: 2, label: 'Double click' },
    ],
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

export function registerTrayBehaviorApplier(applier) {
  trayBehaviorApplier = applier;
}

function normalizeSettingValue(key, value) {
  const def = SETTING_DEFS[key];
  if (def?.type !== 'select') return value;

  const match = def.options.find((opt) => String(opt.value) === String(value));
  return match ? match.value : value;
}

export function setSetting(key, value) {
  store.set(key, normalizeSettingValue(key, value));
  if (key === 'launchAtStartup' || key === 'startMinimized') {
    applyLaunchAtStartup();
  }
  if (key === 'trayOpenClickCount' && trayBehaviorApplier) {
    trayBehaviorApplier();
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
