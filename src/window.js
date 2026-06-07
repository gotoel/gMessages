import { BrowserWindow, app } from 'electron';
import { getStore } from './settings.js';
import { getAppIconPath } from './app-icon.js';

const MESSAGES_URL = 'https://messages.google.com/web';

let mainWindow = null;
let saveBoundsTimer = null;

export function getMainWindow() {
  return mainWindow;
}

export function createMainWindow({ isDev = false } = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  const store = getStore();
  const bounds = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    ...bounds,
    show: false,
    title: 'gMessages',
    icon: getAppIconPath(),
    autoHideMenuBar: true,
    webPreferences: {
      partition: 'persist:gmessages',
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(MESSAGES_URL);

  mainWindow.once('ready-to-show', () => {
    if (!store.get('startMinimized')) {
      mainWindow.show();
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      hideMainWindow();
    }
  });

  mainWindow.on('resize', scheduleSaveBounds);
  mainWindow.on('move', scheduleSaveBounds);

  return mainWindow;
}

function scheduleSaveBounds() {
  if (saveBoundsTimer) clearTimeout(saveBoundsTimer);
  saveBoundsTimer = setTimeout(saveWindowBounds, 500);
}

function saveWindowBounds() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const bounds = mainWindow.getBounds();
  getStore().set('windowBounds', bounds);
}

export function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow();
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.show();
  mainWindow.focus();
}

export function hideMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
}
