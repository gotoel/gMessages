import { app, session } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { configureGpu } from './gpu.js';
import { createMainWindow, showMainWindow } from './window.js';
import { createTray, destroyTray } from './tray.js';
import { initNotifications, registerNotificationHandlers } from './notifications.js';
import { registerBadgeHandlers } from './badge.js';
import { registerShortcuts, unregisterShortcuts } from './shortcuts.js';
import {
  initSettings,
  registerSettingsHandlers,
  applyLaunchAtStartup,
  openSettingsWindow,
} from './settings.js';

configureGpu();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.argv.includes('--dev');
const PARTITION = 'persist:gmessages';

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showMainWindow();
  });

  app.whenReady().then(() => {
    initSettings();
    registerSettingsHandlers();
    initNotifications();
    registerNotificationHandlers();
    registerBadgeHandlers();
    registerShortcuts();
    configureSession();

    createTray({
      onShow: showMainWindow,
      onSettings: openSettingsWindow,
      onQuit: quitApp,
    });

    createMainWindow({ isDev });
    applyLaunchAtStartup();
  });

  app.on('before-quit', () => {
    app.isQuitting = true;
    unregisterShortcuts();
    destroyTray();
  });

  app.on('window-all-closed', () => {
    // Keep running in the system tray.
  });

  app.on('activate', () => {
    showMainWindow();
  });
}

function configureSession() {
  const ses = session.fromPartition(PARTITION);

  ses.registerPreloadScript({
    id: 'gmessages-sw',
    type: 'service-worker',
    filePath: path.join(__dirname, 'sw-preload.cjs'),
  });

  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'notifications') {
      callback(false);
      return;
    }
    callback(true);
  });

  ses.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'notifications') return false;
    return true;
  });
}

function quitApp() {
  app.isQuitting = true;
  app.quit();
}
