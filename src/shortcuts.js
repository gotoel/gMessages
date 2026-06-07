import { globalShortcut } from 'electron';
import { toggleMainWindow } from './window.js';

function toggleMainWindowFromShortcut() {
  toggleMainWindow({ requireFocus: true });
}

export function registerShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+M', toggleMainWindowFromShortcut);
}

export function unregisterShortcuts() {
  globalShortcut.unregisterAll();
}
