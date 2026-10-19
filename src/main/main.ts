import { LibraryTransfer } from './library-transfer';
import { validateChordPage } from '../shared/chords';
import { Bibles } from './bibles';
import { DEFAULT_THEME, contentRecord, readContent, validateTheme, type Catalog, type ContentKind } from '../shared/content';
import { imageDimensions } from './images';
import { readSong, songRecord } from '../shared/songs';
import { app, BrowserWindow, dialog, ipcMain, screen, session, protocol, nativeImage } from 'electron';
import { basename, join } from 'node:path';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { Store, validateText } from './storage';
import { portableDataPath } from './portable';
import { requestPayload, initialPresentation } from './protocol';
import { validateKind } from '../shared/models';
import { presentationTarget, separateDisplay } from './presentation-target';
// X11/XWayland provides the global coordinates required for datashow placement.
if (process.platform === 'linux') app.commandLine.appendSwitch('ozone-platform', 'x11');
import type { Snapshot } from '../shared/contracts';
protocol.registerSchemesAsPrivileged([{ scheme:'zamar-asset', privileges:{standard:true,secure:true,supportFetchAPI:true} }]);
let operator: BrowserWindow | null = null;
let output: BrowserWindow | null = null;
let selectedDisplay: number | null = null;
let closeReason = 'Apresentação encerrada; controles disponíveis.';
let store: Store;
let dataPath = '';
let dataReady = false;
let storageProblem = '';
try {
  dataPath = portableDataPath({ packaged: app.isPackaged, executable: app.getPath('exe'), appPath: app.getAppPath(), platform: process.platform, appImage: process.env.APPIMAGE });
  // Configure before acquiring the instance lock, which also uses userData.
  mkdirSync(join(dataPath, 'session'), { recursive: true });
  app.setPath('userData', dataPath);
  app.setPath('sessionData', join(dataPath, 'session'));
  dataReady = true;
} catch (error) {
  storageProblem = String(error);
}
let state: Snapshot = { revision: 0, text: '', theme: DEFAULT_THEME, hidden: false, black: true, outputOpen: false, mode: 'closed', status: 'Saída fechada' };
function publish(patch: Partial<Snapshot> = {}) {
  const next = { ...state, ...patch, revision: state.revision + 1 };
  if (Object.hasOwn(patch, 'text')) store.setSetting('presentation', JSON.stringify({ text: next.text, chords:next.chords, theme: next.theme, revision: next.revision }));
  state = next;
  for (const window of [operator, output]) if (window && !window.isDestroyed()) window.webContents.send('state', state);
}
function createWindow(role: 'operator' | 'output') {
  const window = new BrowserWindow({ width: 1240, height: 800, show: false, backgroundColor: '#000000', title: role === 'operator' ? 'Zamar Sync' : 'Zamar Sync — Projeção', webPreferences: { preload: join(__dirname, 'preload.js'), nodeIntegration: false, contextIsolation: true, sandbox: true } });
  window.setMenu(null);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.loadFile(join(__dirname, '../renderer/index.html'), { query: { role } });
  return window;
}
app.whenReady().then(async () => {
    if (!dataReady) {
      const answer = await dialog.showMessageBox({ type: 'error', message: 'A pasta portátil não permite abrir os dados.', detail: `${storageProblem}\nEscolha uma pasta gravável ou encerre. Nenhuma pasta alternativa será usada sem sua escolha.`, buttons: ['Escolher pasta de dados', 'Sair'], defaultId: 0, cancelId: 1 });
      if (answer.response !== 0) { app.quit(); return; }
      const selected = await dialog.showOpenDialog({ title: 'Escolher pasta de dados', properties: ['openDirectory', 'createDirectory'] });
      if (selected.canceled || !selected.filePaths[0]) { app.quit(); return; }
      dataPath = selected.filePaths[0];
      mkdirSync(join(dataPath, 'session'), { recursive: true });
      app.setPath('userData', dataPath); app.setPath('sessionData', join(dataPath, 'session'));
    }
    if (!app.requestSingleInstanceLock()) { app.quit(); return; }
    app.on('second-instance', () => { operator?.restore(); operator?.focus(); });
    try { store = new Store(dataPath); }
    catch (error) { dialog.showErrorBox('Não foi possível abrir os dados', `${String(error)}\nOs dados existentes foram preservados.`); app.quit(); return; }
    state = initialPresentation(store.getSetting('presentation'));
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => callback({ cancel: !['file:', 'devtools:', 'zamar-asset:'].some(protocol => details.url.startsWith(protocol)) }));
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    protocol.handle('zamar-asset', request => {
      try {const url=new URL(request.url);if(url.hostname!=='image' || url.search || url.hash)throw new Error();return new Response(new Uint8Array(store.imageBytes(url.pathname.slice(1))),{headers:{'Content-Type':'image/png','Cache-Control':'no-store'}});}
      catch {return new Response('Imagem indisponível',{status:404});}
    });
    const assertImage = (theme: ReturnType<typeof validateTheme>) => {if(theme.image)store.imageBytes(theme.image);};
    const operatorDisplay = () => operator ? screen.getDisplayMatching(operator.getBounds()) : screen.getPrimaryDisplay();
    const canProject = (display: Electron.Display) => separateDisplay(display, operatorDisplay()) && (!operator || separateDisplay(display, { id: operatorDisplay().id, bounds: operator.getBounds() }));
    const monitors = () => screen.getAllDisplays().map(d => ({ id: d.id, label: `${d.label || 'Monitor'} — ${d.size.width} × ${d.size.height}`, primary: d.id === screen.getPrimaryDisplay().id, availableForProjection: canProject(d) }));
    ipcMain.handle('initial', (event, request: unknown) => {
      requestPayload(request);
      if (event.senderFrame !== event.sender.mainFrame || ![operator?.webContents.id, output?.webContents.id].includes(event.sender.id)) throw new Error('Origem inválida');
      const privateAccess = event.sender.id === operator?.webContents.id;
      return { interfaceTheme: store.getSetting('interface-theme') === 'light' ? 'light' : 'dark', draft: privateAccess ? store.read() : '', dataPath: privateAccess ? dataPath : '', monitors: privateAccess ? monitors() : [], snapshot: state };
    });
    const handle = (name: string, action: (payload: unknown) => unknown) => ipcMain.handle(name, (event, request: unknown) => {
      if (event.sender.id !== operator?.webContents.id || event.senderFrame !== event.sender.mainFrame) throw new Error('Comando exclusivo do operador');
      return action(requestPayload(request));
    });
    handle('interface-theme', value => {
      if (value !== 'dark' && value !== 'light') throw new Error('Tema da interface inválido.');
      store.setSetting('interface-theme', value);
    });
    const transfer=new LibraryTransfer(store);
    handle('import-select',async()=>{const selected=await dialog.showOpenDialog(operator!,{title:'Importar texto ou cifra',properties:['openFile'],filters:[{name:'Texto e cifras UTF-8',extensions:['txt','pro','chordpro']}]});return selected.canceled||!selected.filePaths[0]?null:transfer.select(selected.filePaths[0]);});
    handle('import-preview',value=>transfer.preview(value));
    handle('import-confirm',value=>{const p=value as {draft:unknown;choice:Parameters<LibraryTransfer['confirm']>[1];target:Parameters<LibraryTransfer['confirm']>[2]};if(!p)throw new Error('Importação inválida.');return transfer.confirm(p.draft,p.choice,p.target);});
    handle('recovery',()=>transfer.recovery());
    handle('autosave',value=>{const p=value as {epoch:unknown;entries:unknown};if(!p)throw new Error('Salvamento inválido.');return transfer.autosave(p.epoch,p.entries);});
    handle('list-records', kind => store.list(validateKind(kind)));
    handle('save-record', record => store.put(record));
    handle('list-songs', () => {
      const records = store.list('song'); const songs = [];
      for (const record of records) { try { songs.push(readSong(record)); } catch { /* Preserve unsupported legacy records for backup. */ } }
      return { songs, skipped: records.length - songs.length };
    });
    handle('save-song', value => {
      const id = value && typeof value === 'object' ? (value as { id?: unknown }).id : null;
      const existing = store.list('song').find(record => record.id === id);
      return readSong(store.put(songRecord(value, existing)));
    });
    handle('catalog', () => {
      const result:Catalog={texts:[],themes:[],programs:[],lastProgram:store.getSetting('last-program')??null,skipped:0};
      for(const kind of ['text','theme','program'] as const)for(const record of store.list(kind)) {
        try {const value=readContent(kind,record);if(kind==='text')result.texts.push(value as Catalog['texts'][number]);else if(kind==='theme')result.themes.push(value as Catalog['themes'][number]);else result.programs.push(value as Catalog['programs'][number]);}catch{result.skipped++;}
      }
      return result;
    });
    handle('save-content', payload => {
      if(!payload || typeof payload!=='object')throw new Error('Cadastro inválido.');
      const {kind,value}=payload as {kind:ContentKind;value:unknown};
      if(!['text','theme','program'].includes(kind))throw new Error('Tipo de cadastro inválido.');
      const record=contentRecord(kind,value);
      if(kind==='theme')assertImage(validateTheme(value));
      if(kind==='program')for(const item of (readContent(kind,record) as Catalog['programs'][number]).items)assertImage(item.theme);
      const saved=readContent(kind,store.put(record));
      if(kind==='program')store.setSetting('last-program',saved.id);
      return saved;
    });
    handle('select-program', id => {if(typeof id!=='string' || !store.list('program').some(p=>p.id===id))throw new Error('Programação não encontrada.');store.setSetting('last-program',id);});
    handle('import-image', async () => {
      const selected=await dialog.showOpenDialog(operator!,{title:'Importar imagem de fundo',properties:['openFile'],filters:[{name:'PNG ou JPEG',extensions:['png','jpg','jpeg']}]});
      if(selected.canceled || !selected.filePaths[0])return null;
      const path=selected.filePaths[0];if(statSync(path).size>10*1024*1024)throw new Error('Imagem acima de 10 MiB.');
      const bytes=readFileSync(path);imageDimensions(bytes);let image=nativeImage.createFromBuffer(bytes);
      if(image.isEmpty())throw new Error('Não foi possível ler esta imagem.');
      const size=image.getSize();const scale=Math.min(1,1920/size.width,1080/size.height);
      if(scale<1)image=image.resize({width:Math.max(1,Math.round(size.width*scale)),height:Math.max(1,Math.round(size.height*scale)),quality:'best'});
      return store.addAsset(basename(path).slice(0,200),'image/png',image.toPNG()).sha256;
    });
    handle('hide-text', () => { if (!state.outputOpen) throw new Error('A apresentação está encerrada.'); publish({ hidden: !state.hidden }); });
    const bibles=new Bibles(store);
    handle('bible-catalog',()=>bibles.catalog());
    handle('bible-select',async()=>{const selected=await dialog.showOpenDialog(operator!,{title:'Importar Bíblia SQL ou SQLite',properties:['openFile'],filters:[{name:'Bíblia SQL ou SQLite',extensions:['sql','sqlite','sqlite3','db']}]});if(selected.canceled || !selected.filePaths[0])return null;return bibles.select(selected.filePaths[0]);});
    handle('bible-cancel',()=>bibles.cancel());
    handle('bible-preview',value=>{const p=value as {token:string;mapping:Parameters<Bibles['preview']>[1]};if(!p || typeof p.token!=='string' || !p.mapping)throw new Error('Mapeamento inválido.');return bibles.preview(p.token,p.mapping);});
    handle('bible-import',async value=>{const p=value as {token:string;fields:Record<string,unknown>;mode:'new'|'copy'|'replace';replaceId:string|null;confirmed:boolean};if(!p || !p.fields)throw new Error('Cadastro inválido.');if(p.mode==='replace'){const affected=store.list('program').filter(record=>Array.isArray(record.data.items) && record.data.items.some((item:{source?:{kind?:string;id?:string}})=>item.source?.kind==='bible' && item.source.id===p.replaceId)).length;const answer=await dialog.showMessageBox(operator!,{type:'warning',message:'Substituir esta tradução?',detail:`${affected} programação(ões) com referências a esta tradução. Uma cópia de segurança será criada. Trechos preparados serão preservados; atualizar pela origem será uma ação separada.`,buttons:['Cancelar','Substituir'],defaultId:0,cancelId:0});if(answer.response!==1)return null;}return bibles.import(p.token,p.fields,p.mode,p.replaceId,p.confirmed===true);});
    handle('bible-default',id=>{if(typeof id!=='string')throw new Error('Tradução inválida.');bibles.setDefault(id);});
    handle('bible-query',value=>{const p=value as {id:string;request:Parameters<Bibles['query']>[1]};if(!p || typeof p.id!=='string' || !p.request)throw new Error('Consulta inválida.');return bibles.query(p.id,p.request);});
    handle('bible-passage',value=>{const p=value as {id:string;reference:string};if(!p || typeof p.id!=='string' || typeof p.reference!=='string')throw new Error('Referência inválida.');return bibles.passage(p.id,p.reference);});
    handle('bible-remove',async id=>{if(typeof id!=='string')throw new Error('Tradução inválida.');const affected=store.list('program').filter(p=>Array.isArray(p.data.items) && p.data.items.some((i:{source?:{kind?:string;id?:string}})=>i.source?.kind==='bible' && i.source.id===id)).length;const answer=await dialog.showMessageBox(operator!,{type:'warning',message:'Remover esta Bíblia?',detail:`${affected} programação(ões) com referências a esta tradução. As cópias preparadas serão preservadas. Uma cópia de segurança será criada.`,buttons:['Cancelar','Remover'],defaultId:0,cancelId:0});if(answer.response!==1)return false;bibles.remove(id);return true;});
    let maintenance = false;
    const maintain = async (action: () => Promise<unknown>) => {
      if (maintenance) throw new Error('Outra operação de backup ou restauração está em andamento.');
      maintenance = true;
      try { return await action(); } finally { maintenance = false; }
    };
    handle('create-backup', () => maintain(async () => {
      const destination = await dialog.showSaveDialog(operator!, { title: 'Criar backup', defaultPath: `zamar-${new Date().toISOString().slice(0,10)}.zamar-backup`, filters: [{ name: 'Backup Zamar', extensions: ['zamar-backup'] }] });
      if (destination.canceled || !destination.filePath) return null;
      store.createBackup(destination.filePath);
      return destination.filePath;
    }));
    handle('restore-backup', () => maintain(async () => {
      const source = await dialog.showOpenDialog(operator!, { title: 'Restaurar backup', properties: ['openFile'], filters: [{ name: 'Backup Zamar', extensions: ['zamar-backup'] }] });
      if (source.canceled || !source.filePaths[0]) return null;
      const answer = await dialog.showMessageBox(operator!, { type: 'warning', message: 'Restaurar os dados deste backup?', detail: 'Isso substitui os dados salvos e descarta o alterações não salvas no conteúdo e na programação. Uma cópia dos dados atuais será criada antes da restauração. A saída será encerrada.', buttons: ['Cancelar', 'Restaurar'], defaultId: 0, cancelId: 0 });
      if (answer.response !== 1) return null;
      bibles.cancel();
      const previousBackup = store.restoreBackup(source.filePaths[0]);transfer.reset();
      const restored = initialPresentation(store.getSetting('presentation'));
      output?.close();
      state = { ...restored, revision: Math.max(restored.revision, state.revision + 1) };
      publish();
      return { draft: store.read(), previousBackup };
    }));
    handle('save', value => store.save(validateText(value)));
    handle('present', value => { if (!state.outputOpen) throw new Error('Inicie a apresentação antes de apresentar.'); const payload = typeof value==='string' ? {text:value,theme:DEFAULT_THEME} : value as {text:unknown;theme:unknown;chords?:unknown}|null; if(!payload)throw new Error('Slide inválido.'); const text=validateText(payload.text);const theme=validateTheme(payload.theme);assertImage(theme);if(!text.trim())throw new Error('Informe um texto para apresentar.');publish({text,theme,chords:payload.chords?validateChordPage(payload.chords):undefined,black:false,hidden:false}); });
    handle('black', () => { if (!state.outputOpen) throw new Error('A apresentação está encerrada.'); publish({ black: !state.black }); });
    handle('close-output', () => {
      closeReason = 'Apresentação encerrada; controles disponíveis.';
      if (output) output.close();
      else publish({ mode: 'closed', outputOpen: false, black: true, status: closeReason });
    });
    handle('open-output', (id: unknown) => {
      if (output || state.outputOpen) return false;
      const candidate = presentationTarget(id, screen.getAllDisplays(), operatorDisplay());
      const display = candidate && canProject(candidate as Electron.Display) ? candidate : null;
      if (!display) {
        selectedDisplay = null;
        publish({ mode: 'rehearsal', outputOpen: true, black: true, status: 'Ensaio local: os controles continuam visíveis. Nenhuma janela de projeção foi aberta.' });
        return true;
      }
      closeReason = 'Apresentação encerrada; controles disponíveis.';
      selectedDisplay = display.id;
      publish({ mode: 'external', black: true, outputOpen: true, status: 'Apresentação no datashow; controles neste monitor.' });
      output = createWindow('output');
      const window = output;
      window.setBounds(display.bounds);
      window.setFullScreen(true);
      window.once('ready-to-show', () => {
        if (window.isDestroyed()) return;
        const current = screen.getAllDisplays().find(d => d.id === display.id);
        if (!current || !canProject(current)) { window.close(); return; }
        window.showInactive();
        operator?.focus();
        publish();
      });
      window.webContents.on('before-input-event', (_event, input) => { if (input.key === 'Escape' && input.type === 'keyDown') window.close(); });
      window.webContents.on('render-process-gone', () => { if (!window.isDestroyed()) window.close(); });
      window.on('closed', () => { output = null; selectedDisplay = null; publish({ mode: 'closed', black: true, outputOpen: false, status: closeReason }); });
      return true;
    });
    const ensureSafeOutput = (updateBounds = true) => {
      if (!output) return;
      const target = screen.getAllDisplays().find(d => d.id === selectedDisplay);
      if (!target || !canProject(target)) {
        closeReason = 'Projeção suspensa: não há uma tela separada dos controles. Use Estender ou inicie um ensaio local.';
        output.hide(); output.close();
        publish({ mode: 'closed', outputOpen: false, black: true, status: closeReason });
      } else if (updateBounds) output.setBounds(target.bounds);
    };
    screen.on('display-removed', (_event, display) => {
      if (display.id === selectedDisplay && output) { closeReason = 'Datashow desconectado. Controles preservados; selecione a saída para retomar.'; output.hide(); output.close(); publish({ mode: 'closed', outputOpen: false, black: true, status: closeReason }); }
      ensureSafeOutput(); publish();
    });
    screen.on('display-added', () => publish());
    screen.on('display-metrics-changed', () => { ensureSafeOutput(); publish(); });
    operator = createWindow('operator');
    let operatorDisplayId = operatorDisplay().id;
    operator.on('move', () => {
      ensureSafeOutput(false);
      const current = operatorDisplay().id;
      if (current !== operatorDisplayId) { operatorDisplayId = current; publish(); }
    });
    operator.on('resize', () => { ensureSafeOutput(false); publish(); });
    operator.once('ready-to-show', () => operator?.show());
    operator.webContents.on('will-prevent-unload', event => {
      if (!operator) return;
      const choice = dialog.showMessageBoxSync(operator, { type: 'warning', message: 'Há alterações que ainda não foram salvas.', detail: 'Volte ao editor e salve o conteúdo para preservá-lo.', buttons: ['Continuar editando', 'Descartar e fechar'], defaultId: 0, cancelId: 0 });
      if (choice === 1) event.preventDefault();
    });
    operator.on('closed', () => { bibles.cancel(); operator = null; output?.close(); app.quit(); });
}).catch(error => { dialog.showErrorBox('Falha ao iniciar', String(error)); app.quit(); });
  app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => store?.close());
