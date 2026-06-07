import { app } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getAppIconPath() {
  const root = app.isPackaged ? app.getAppPath() : path.join(__dirname, '..');
  return path.join(root, 'assets', 'icon.png');
}
