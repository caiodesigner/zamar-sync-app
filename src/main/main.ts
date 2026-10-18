import { app, BrowserWindow, dialog, ipcMain, screen, session } from 'electron';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { Store, validateText } from './storage';
import { portableDataPath } from './portable';
import { requestPayload, initialPresentation } from './protocol';
import { validateKind } from '../shared/models';
import { presentationTarget, separateDisplay } from './presentation-target';
// X11/XWayland provides the global coordinates required for datashow placement.
if (process.platform === 'linux') app.commandLine.appendSwitch('ozone-platform', 'x11');
import type { Snapshot } from '../shared/contracts';
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
let state: Snapshot = { revision: 0, text: '', black: true, outputOpen: false, mode: 'closed', status: 'Saída fechada' };
function publish(patch: Partial<Snapshot> = {}) {
  const next = { ...state, ...patch, revision: state.revision + 1 };
  if (Object.hasOwn(patch, 'text')) store.setSetting('presentation', JSON.stringify({ text: next.text, revision: next.revision }));
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
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => callback({ cancel: !['file:', 'devtools:'].some(protocol => details.url.startsWith(protocol)) }));
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    const operatorDisplay = () => operator ? screen.getDisplayMatching(operator.getBounds()) : screen.getPrimaryDisplay();
    const canProject = (display: Electron.Display) => separateDisplay(display, operatorDisplay()) && (!operator || separateDisplay(display, { id: operatorDisplay().id, bounds: operator.getBounds() }));
    const monitors = () => screen.getAllDisplays().map(d => ({ id: d.id, label: `${d.label || 'Monitor'} — ${d.size.width} × ${d.size.height}`, primary: d.id === screen.getPrimaryDisplay().id, availableForProjection: canProject(d) }));
    ipcMain.handle('initial', (event, request: unknown) => {
      requestPayload(request);
      if (event.senderFrame !== event.sender.mainFrame || ![operator?.webContents.id, output?.webContents.id].includes(event.sender.id)) throw new Error('Origem inválida');
      const privateAccess = event.sender.id === operator?.webContents.id;
      return { draft: privateAccess ? store.read() : '', dataPath: privateAccess ? dataPath : '', monitors: privateAccess ? monitors() : [], snapshot: state };
    });
    const handle = (name: string, action: (payload: unknown) => unknown) => ipcMain.handle(name, (event, request: unknown) => {
      if (event.sender.id !== operator?.webContents.id || event.senderFrame !== event.sender.mainFrame) throw new Error('Comando exclusivo do operador');
      return action(requestPayload(request));
    });
    handle('list-records', kind => store.list(validateKind(kind)));
    handle('save-record', record => store.put(record));
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
      const answer = await dialog.showMessageBox(operator!, { type: 'warning', message: 'Restaurar os dados deste backup?', detail: 'Isso substitui os dados salvos e descarta o rascunho e a programação desta sessão. Uma cópia dos dados atuais será criada antes da restauração. A saída será encerrada.', buttons: ['Cancelar', 'Restaurar'], defaultId: 0, cancelId: 0 });
      if (answer.response !== 1) return null;
      const previousBackup = store.restoreBackup(source.filePaths[0]);
      const restored = initialPresentation(store.getSetting('presentation'));
      output?.close();
      state = { ...restored, revision: Math.max(restored.revision, state.revision + 1) };
      publish();
      return { draft: store.read(), previousBackup };
    }));
    handle('save', value => store.save(validateText(value)));
    handle('present', value => { if (!state.outputOpen) throw new Error('Inicie a apresentação antes de apresentar.'); const text = validateText(value); if (!text.trim()) throw new Error('Informe um texto para apresentar.'); publish({ text, black: false }); });
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
      const choice = dialog.showMessageBoxSync(operator, { type: 'warning', message: 'Há alterações no rascunho que ainda não foram salvas.', detail: 'Volte ao editor e use Salvar texto para preservá-las.', buttons: ['Continuar editando', 'Descartar e fechar'], defaultId: 0, cancelId: 0 });
      if (choice === 1) event.preventDefault();
    });
    operator.on('closed', () => { operator = null; output?.close(); app.quit(); });
}).catch(error => { dialog.showErrorBox('Falha ao iniciar', String(error)); app.quit(); });
  app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => store?.close());
