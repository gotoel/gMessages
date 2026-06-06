import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('settingsAPI', {
  getAll: () => ipcRenderer.invoke('settings:getAll'),
  set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
});
