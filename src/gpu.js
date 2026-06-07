import { app } from 'electron';

/**
 * Chromium GPU workarounds on Windows. Use --disable-gpu or GMESSAGES_DISABLE_GPU=1
 * if the app is run from a mapped network drive (error_code=18).
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

  if (forceSoftware) {
    app.disableHardwareAcceleration();
  }
}
