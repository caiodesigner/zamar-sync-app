import { contextBridge, ipcRenderer } from 'electron';
import type { Bridge, Snapshot } from '../shared/contracts';
const invoke = (channel: string, payload: unknown = null) => ipcRenderer.invoke(channel, { version: 1, payload });
const bridge: Bridge = {
  initial: () => invoke('initial'),
  save: text => invoke('save', text),
  present: text => invoke('present', text),
  openOutput: id => invoke('open-output', id),
  closeOutput: () => invoke('close-output'),
  black: () => invoke('black'),
  hideText: () => invoke('hide-text'),
  listSongs: () => invoke('list-songs'),
  saveSong: song => invoke('save-song', song),
  catalog: () => invoke('catalog'),
  saveContent: (kind,value) => invoke('save-content',{kind,value}),
  selectProgram: id => invoke('select-program',id),
  importImage: () => invoke('import-image'),
  listRecords: kind => invoke('list-records', kind),
  saveRecord: record => invoke('save-record', record),
  createBackup: () => invoke('create-backup'),
  restoreBackup: () => invoke('restore-backup'),
  onState: callback => {
    const listener = (_event: unknown, state: Snapshot) => callback(state);
    ipcRenderer.on('state', listener);
    return () => ipcRenderer.removeListener('state', listener);
  }
};
contextBridge.exposeInMainWorld('zamar', bridge);
