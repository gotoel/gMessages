import { app, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
export const APP_USER_MODEL_ID = 'com.gotoel.gmessages';

function getShortcutIconPath() {
  if (app.isPackaged) {
    return process.execPath;
  }
  return path.join(ROOT, 'build', 'icon.ico');
}

export function configureWindowsNotifications() {
  if (process.platform !== 'win32') return;

  const shortcutPath = path.join(
    app.getPath('appData'),
    'Microsoft',
    'Windows',
    'Start Menu',
    'Programs',
    'gMessages.lnk'
  );

  const options = {
    target: process.execPath,
    cwd: app.getAppPath(),
    description: 'gMessages',
    icon: getShortcutIconPath(),
    appUserModelId: APP_USER_MODEL_ID,
  };

  if (app.isPackaged) {
    options.args = '';
  } else {
    options.args = '.';
    options.cwd = ROOT;
  }

  try {
    if (!shell.writeShortcutLink(shortcutPath, 'replace', options)) {
      console.warn('Could not register Windows notification shortcut at', shortcutPath);
    }
  } catch (err) {
    console.warn('Failed to register Windows notification shortcut:', err);
  }
}
