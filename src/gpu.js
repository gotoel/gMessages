import { app } from 'electron';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Chromium often cannot spawn a GPU child process from network/mapped drives
 * (error_code=18). Apply workarounds before app.ready.
 */
export function configureGpu() {
  const forceSoftware =
    process.argv.includes('--disable-gpu') ||
    process.env.GMESSAGES_DISABLE_GPU === '1';

  if (process.platform !== 'win32') {
    if (forceSoftware) {
      app.disableHardwareAcceleration();
    }
    return;
  }

  app.commandLine.appendSwitch('disable-gpu-sandbox');
  app.commandLine.appendSwitch('in-process-gpu');

  const onNetworkDrive = isNetworkDrive(ROOT);

  if (forceSoftware || onNetworkDrive) {
    app.disableHardwareAcceleration();
  }
}

function isNetworkDrive(dirPath) {
  if (process.platform !== 'win32') return false;

  const { root } = path.parse(path.resolve(dirPath));
  const drive = root.replace(/\\$/, '');
  if (!drive) return false;

  try {
    const script = `(Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='${drive}'").DriveType`;
    const output = execSync(`powershell -NoProfile -Command "${script}"`, {
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    }).trim();

    // 4 = Network (mapped drives like L:)
    return output === '4';
  } catch {
    return false;
  }
}
