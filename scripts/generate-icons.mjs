import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import pngToIco from 'png-to-ico';

const require = createRequire(import.meta.url);
const png2icons = require('png2icons');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pngPath = path.join(root, 'assets', 'icon.png');
const buildDir = path.join(root, 'build');

fs.mkdirSync(buildDir, { recursive: true });

const png = fs.readFileSync(pngPath);

const ico = await pngToIco(pngPath);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico);
console.log('Wrote', path.join(buildDir, 'icon.ico'));

const icns = png2icons.createICNS(png, png2icons.BILINEAR, 0);
if (!icns) {
  throw new Error('Failed to generate icon.icns from assets/icon.png');
}
fs.writeFileSync(path.join(buildDir, 'icon.icns'), icns);
console.log('Wrote', path.join(buildDir, 'icon.icns'));

fs.copyFileSync(pngPath, path.join(buildDir, 'icon.png'));
console.log('Wrote', path.join(buildDir, 'icon.png'));
