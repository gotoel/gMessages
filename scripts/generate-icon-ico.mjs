import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pngToIco from 'png-to-ico';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pngPath = path.join(root, 'assets', 'icon.png');
const buildDir = path.join(root, 'build');
const icoPath = path.join(buildDir, 'icon.ico');

fs.mkdirSync(buildDir, { recursive: true });

const ico = await pngToIco(pngPath);
fs.writeFileSync(icoPath, ico);
console.log('Wrote', icoPath);
