import { app, nativeImage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, '.electron-dist', 'tray-icon-test');

const trayModuleUrl = pathToFileURL(path.join(ROOT, 'src', 'tray.js')).href;
const { createTrayIcon } = await import(trayModuleUrl);

app.whenReady().then(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const plain = createTrayIcon(false);
  const unread = createTrayIcon(true);

  fs.writeFileSync(path.join(OUT_DIR, 'tray-plain.png'), plain.toPNG());
  fs.writeFileSync(path.join(OUT_DIR, 'tray-unread.png'), unread.toPNG());

  const plainSize = nativeImage.createFromBuffer(plain.toPNG()).getSize();
  const unreadSize = nativeImage.createFromBuffer(unread.toPNG()).getSize();

  console.log('Tray icon test output:', OUT_DIR);
  console.log('plain:', plainSize, plain.isEmpty() ? 'EMPTY' : 'ok');
  console.log('unread:', unreadSize, unread.isEmpty() ? 'EMPTY' : 'ok');

  if (plain.isEmpty() || unread.isEmpty()) {
    app.exitCode = 1;
  }

  app.quit();
});
