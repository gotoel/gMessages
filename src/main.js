import { app, session } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { configureGpu } from './gpu.js';
import { createMainWindow, openGoogleMessagesSettings, showMainWindow } from './window.js';
import { applyTrayClickBehavior, createTray, destroyTray } from './tray.js';
import {
  initNotifications,
  registerNotificationHandlers,
  registerServiceWorkerNotificationBridge,
} from './notifications.js';
import { registerBadgeHandlers } from './badge.js';
import { registerShortcuts, unregisterShortcuts } from './shortcuts.js';
import {
  initSettings,
  registerSettingsHandlers,
  registerTrayBehaviorApplier,
  applyLaunchAtStartup,
  openSettingsWindow,
} from './settings.js';
import { configureWindowsNotifications, APP_USER_MODEL_ID } from './windows-notifications.js';

app.setName('gMessages');

if (process.platform === 'win32') {
  app.setAppUserModelId(APP_USER_MODEL_ID);
}

configureGpu();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.argv.includes('--dev');
const PARTITION = 'persist:gmessages';

/** Permissions Google Messages may request; everything else is denied. */
const ALLOWED_PERMISSIONS = new Set([
  'notifications',
  'media',
  'clipboard-read',
  'clipboard-sanitized-write',
  'fullscreen',
]);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showMainWindow();
  });

  app.whenReady().then(() => {
    configureWindowsNotifications();
    initSettings();
    registerSettingsHandlers();
    configureSession();
    initNotifications();
    registerNotificationHandlers();
    registerServiceWorkerNotificationBridge(PARTITION);
    registerBadgeHandlers();
    registerShortcuts();
    registerTrayBehaviorApplier(applyTrayClickBehavior);

    createTray({
      onShow: showMainWindow,
      onSettings: openSettingsWindow,
      onGoogleSettings: openGoogleMessagesSettings,
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
    id: 'gmessages-page',
    type: 'frame',
    filePath: path.join(__dirname, 'page-main.cjs'),
    world: 'MAIN',
  });

  ses.registerPreloadScript({
    id: 'gmessages-sw',
    type: 'service-worker',
    filePath: path.join(__dirname, 'sw-preload.cjs'),
  });

  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(ALLOWED_PERMISSIONS.has(permission));
  });

  ses.setPermissionCheckHandler((_webContents, permission) => {
    return ALLOWED_PERMISSIONS.has(permission);
  });
}

function quitApp() {
  app.isQuitting = true;
  app.quit();
}
