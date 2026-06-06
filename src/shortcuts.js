import { globalShortcut } from 'electron';
import { showMainWindow, hideMainWindow, getMainWindow } from './window.js';

export function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+M', toggleMainWindow);
}

export function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}

function toggleMainWindow() {
  const win = getMainWindow();
  if (win && !win.isDestroyed() && win.isVisible() && win.isFocused()) {
    hideMainWindow();
  } else {
    showMainWindow();
  }
}
