import { app } from 'electron';

/**
 * Opt-in GPU workarounds for mapped network drives and other Chromium GPU issues
 * (error_code=18). Use --disable-gpu or GMESSAGES_DISABLE_GPU=1.
 */
export function configureGpu() {
  const forceSoftware =
    process.argv.includes('--disable-gpu') ||
    process.env.GMESSAGES_DISABLE_GPU === '1';

  if (!forceSoftware) return;

  app.disableHardwareAcceleration();

  if (process.platform === 'win32') {
    app.commandLine.appendSwitch('disable-gpu-sandbox');
    app.commandLine.appendSwitch('in-process-gpu');
  }
}
