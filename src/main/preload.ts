import { contextBridge, ipcRenderer } from 'electron';
import type { Bridge, Snapshot } from '../shared/contracts';
const invoke = (channel: string, payload: unknown = null) => ipcRenderer.invoke(channel, { version: 1, payload });
const bridge: Bridge = {
  selectImport:()=>invoke('import-select'),
  previewImport:draft=>invoke('import-preview',draft),
  confirmImport:(draft,choice,target)=>invoke('import-confirm',{draft,choice,target}),
  recovery:()=>invoke('recovery'),
  autosave:(epoch,entries)=>invoke('autosave',{epoch,entries}),
  initial: () => invoke('initial'),
  setInterfaceTheme: theme => invoke('interface-theme', theme),
  save: text => invoke('save', text),
  present: text => invoke('present', text),
  openOutput: id => invoke('open-output', id),
  closeOutput: () => invoke('close-output'),
  black: () => invoke('black'),
  hideText: () => invoke('hide-text'),
  listSongs: () => invoke('list-songs'),
  saveSong: song => invoke('save-song', song),
  bibleCatalog:()=>invoke('bible-catalog'),
  selectBibleSql:()=>invoke('bible-select'),
  previewBible:(token,mapping)=>invoke('bible-preview',{token,mapping}),
  cancelBibleImport:()=>invoke('bible-cancel'),
  importBible:(token,fields,mode,replaceId,confirmed)=>invoke('bible-import',{token,fields,mode,replaceId,confirmed}),
  defaultBible:id=>invoke('bible-default',id),
  removeBible:id=>invoke('bible-remove',id),
  queryBible:(id,request)=>invoke('bible-query',{id,request}),
  biblePassage:(id,reference)=>invoke('bible-passage',{id,reference}),
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
