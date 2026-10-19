const { _electron: electron } = require('playwright');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, cpSync, rmSync, readdirSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
(async () => {
 const directory = mkdtempSync(join(tmpdir(), 'zamar-projeção-'));
 process.on('exit', () => rmSync(directory, {recursive:true,force:true}));
 const appPath = join(directory, 'aplicativo portátil');
 const windows = process.platform === 'win32';
 if (!windows && process.platform !== 'linux') throw new Error('Teste homologado somente para Windows e Linux.');
 const format = process.env.ZAMAR_SMOKE_FORMAT || 'dir';
 const env = {...process.env}; delete env.ELECTRON_RUN_AS_NODE; delete env.APPIMAGE; delete env.APPDIR; delete env.APPIMAGE_EXTRACT_AND_RUN;
 let executablePath = join(appPath, windows ? 'Zamar Sync.exe' : 'zamar-sync');
 if (format === 'dev') {
  mkdirSync(appPath);
  cpSync(resolve('dist'), join(appPath,'dist'), {recursive:true});
  cpSync(resolve('package.json'), join(appPath,'package.json'));
  executablePath = require('electron');
 } else if (!windows && format === 'appimage') {
  mkdirSync(appPath);
  const source = readdirSync('release').find(name => name.startsWith(`zamar-sync-${require('../package.json').version}-`) && name.endsWith('.AppImage'));
  assert(source, 'Gere o AppImage antes deste teste');
  executablePath = join(appPath, source);
  cpSync(resolve('release',source), executablePath);
  env.APPIMAGE_EXTRACT_AND_RUN = '1';
 } else if (!windows && format === 'tar') {
  mkdirSync(appPath);
  const source = readdirSync('release').find(name => name.startsWith(`zamar-sync-${require('../package.json').version}-`) && name.endsWith('-linux-x64.tar.gz'));
  assert(source, 'Gere o tar.gz antes deste teste');
  execFileSync('tar', ['-xzf', resolve('release', source), '--strip-components=1', '-C', appPath]);
 } else cpSync(resolve(windows ? 'release/win-unpacked' : 'release/linux-unpacked'), appPath, {recursive:true});
 let app;
 async function launch() { return electron.launch({executablePath, args: format === 'dev' ? [appPath] : [], env, timeout:30000}); }
 try {
  app = await launch();
  let page = await app.firstWindow();
  await page.getByRole('heading', {name:'Sua mensagem em destaque.'}).waitFor();
  const text = '[C]Canção de teste\n[G/B]Coração e fé 🎵';
  await page.locator('textarea').fill(text);
  await page.getByRole('button', {name:'Salvar texto',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Salvo no computador'}).waitFor();
  assert.equal(await page.evaluate(() => typeof window.require), 'undefined');
  await app.close(); app = await launch(); page = await app.firstWindow();
  try { await page.waitForFunction(expected => document.querySelector('textarea')?.value === expected, text); }
  catch (error) {
    console.error('Reopen diagnostic:', await page.evaluate(async () => ({ draft: document.querySelector('textarea')?.value, initial: await window.zamar.initial(), message: document.querySelector('[role=status]')?.textContent }))); throw error;
  }
  const initial = await page.evaluate(() => window.zamar.initial());
  assert.equal(initial.draft, text); assert(initial.dataPath.startsWith(appPath));
  await page.keyboard.press('Control+f');
  assert.equal(await page.getByRole('textbox',{name:'Buscar na biblioteca',exact:true}).evaluate(el => document.activeElement === el),true);
  await page.getByRole('textbox',{name:'Buscar na biblioteca',exact:true}).fill('sem resultado aqui');
  await page.getByRole('heading',{name:'Nenhum resultado',exact:true}).waitFor();
  await page.getByRole('textbox',{name:'Buscar na biblioteca',exact:true}).fill('');
  const presentBox = await page.getByRole('button',{name:'Apresentar',exact:true}).boundingBox();
  assert(presentBox && presentBox.y + presentBox.height <= await page.evaluate(() => window.innerHeight), 'Apresentar deve permanecer visível sem rolar');
  await page.getByRole('button', {name:'Guia rápido',exact:true}).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button', {name:'Fechar janela',exact:true}).click();
  await page.getByRole('tab', {name:'Bíblia',exact:true}).click();
  await page.getByRole('button', {name:'Como importar uma Bíblia',exact:true}).click();
  await page.getByRole('heading', {name:'Importar Bíblia (.sql)',exact:true}).waitFor();
  await page.getByRole('button', {name:'Fechar janela',exact:true}).click();
  await page.getByRole('tab', {name:'Músicas',exact:true}).click();
  await page.getByRole('button', {name:'Carregar exemplo de música',exact:true}).click();
  await page.getByRole('button',{name:'Salvar música',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Música salva no computador'}).waitFor();
  await page.getByRole('button', {name:'Adicionar conteúdo preparado',exact:false}).click();
  assert.equal(await page.locator('.queue-list li').count(), 1);
  await page.getByRole('button',{name:'Salvar programação',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Programação salva no computador'}).waitFor();
  await page.getByRole('button', {name:'Preparar bloco 2',exact:true}).click();
  assert.match(await page.getByLabel('Prévia do bloco selecionado', {exact:true}).innerText(), /Nossa voz/);
  assert.equal((await page.evaluate(() => window.zamar.initial())).snapshot.black, true);
  // Regression: local rehearsal must keep the real operator window visible.
  await page.locator('#monitor').selectOption('rehearsal');
  await page.getByRole('button',{name:'Iniciar apresentação',exact:true}).click();
  await page.locator('.operator.presenting').waitFor();
  assert.equal((await page.evaluate(() => window.zamar.initial())).snapshot.mode,'rehearsal');
  assert.equal(await app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows().length),1);
  assert.equal(await app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows()[0].isFullScreen()),false);
  await page.getByRole('button',{name:'Apresentar',exact:true}).click();
  await page.waitForFunction(() => document.querySelector('.live-preview')?.textContent.includes('Nossa voz'));
  await page.getByRole('button',{name:/^Tela preta/}).click();
  assert.equal((await page.evaluate(() => window.zamar.initial())).snapshot.black,true);
  assert.equal(await page.getByRole('button',{name:'Encerrar apresentação',exact:true}).isVisible(),true);
  if(process.env.ZAMAR_PRESENTER_SCREENSHOT) await page.screenshot({path:process.env.ZAMAR_PRESENTER_SCREENSHOT});
  await page.getByRole('button',{name:'Encerrar apresentação',exact:true}).click();
  await page.waitForFunction(async () => !(await window.zamar.initial()).snapshot.outputOpen);
  await page.evaluate(id => window.zamar.openOutput(id),initial.monitors.find(d => !d.availableForProjection).id);
  assert.equal((await page.evaluate(() => window.zamar.initial())).snapshot.mode,'rehearsal');
  assert.equal(await app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows().length),1);
  await page.evaluate(() => window.zamar.closeOutput());
  await page.waitForFunction(async () => !(await window.zamar.initial()).snapshot.outputOpen);
  console.log('PASS: local rehearsal, blackout and primary-screen requests never cover the real operator monitor.');
  await page.getByRole('tab',{name:'Textos',exact:true}).click();
  await page.getByRole('button',{name:'Abrir rascunho',exact:true}).click();
  // Simulated external monitor: suppress native fullscreen/showing so this test
  // cannot cover the host monitor. This verifies routing, not physical hardware.
  await app.evaluate(({screen,BrowserWindow}) => {
    const host = screen.getDisplayMatching(BrowserWindow.getAllWindows()[0].getBounds());
    const external = {...host,id:9001,label:'Datashow simulado',bounds:{...host.bounds,x:host.bounds.x+host.bounds.width},workArea:{...host.workArea,x:host.bounds.x+host.bounds.width}};
    screen.getAllDisplays = () => [host,external];
    BrowserWindow.prototype.setFullScreen = function() {};
    BrowserWindow.prototype.showInactive = function() {};
    screen.emit('display-added',{},external);
  });
  await page.waitForFunction(() => !!document.querySelector('option[value="9001"]'));
  await page.locator('#monitor').selectOption('9001');
  const outputPromise = app.waitForEvent('window');
  await page.getByRole('button',{name:'Iniciar apresentação',exact:true}).click();
  const output = await outputPromise; await output.locator('.projection').waitFor();
  assert.equal(await output.locator('.projection').innerText(), '');
  await page.evaluate(() => window.zamar.present('[D]Mensagem pública'));
  await output.waitForFunction(() => document.querySelector('.projection').textContent === '[D]Mensagem pública');
  assert.deepEqual(await output.locator('.slide-canvas').evaluate(el=>[el.style.width,el.style.height]),['1600px','900px']);
  await page.evaluate(()=>window.zamar.hideText());
  await output.waitForFunction(()=>document.querySelector('.projection').textContent==='');
  await page.evaluate(()=>window.zamar.hideText());
  await output.waitForFunction(()=>document.querySelector('.projection').textContent==='[D]Mensagem pública');
  await page.getByRole('button',{name:'Editar conteúdo',exact:true}).click();
  await page.locator('textarea').fill('Rascunho privado');
  assert.equal(await output.locator('.projection').innerText(), '[D]Mensagem pública');
  await assert.rejects(() => output.evaluate(() => window.zamar.present('Comando indevido')));
  const publicInitial = await output.evaluate(() => window.zamar.initial());
  assert.equal(publicInitial.draft, ''); assert.equal(publicInitial.dataPath, '');
  await assert.rejects(() => output.evaluate(() => window.zamar.listRecords('song')));
  await assert.rejects(() => page.evaluate(() => window.zamar.save(42)));
  await page.evaluate(() => window.zamar.black());
  await output.waitForFunction(() => document.querySelector('.projection').textContent === '');
  // Synthetic removal verifies the handler, not real OS/display behavior.
  await app.evaluate(({screen}) => screen.emit('display-removed', {}, screen.getAllDisplays().find(d => d.id === 9001)));
  await page.waitForFunction(async () => !(await window.zamar.initial()).snapshot.outputOpen);
  assert.equal((await page.evaluate(() => window.zamar.initial())).snapshot.black, true);
  const closeResult = await app.evaluate(({dialog,BrowserWindow}) => new Promise(resolve => {
    dialog.showMessageBoxSync = () => { setTimeout(() => resolve('kept'),0); return 0; };
    BrowserWindow.getAllWindows()[0].close();
  }));
  assert.equal(closeResult,'kept'); assert.equal(page.isClosed(),false);
  await page.getByRole('button',{name:'Salvar texto',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Salvo no computador'}).waitFor();
  const backupFile = join(directory, 'electron.zamar-backup');
  await app.evaluate(({dialog}, file) => { dialog.showSaveDialog = async () => ({canceled:false,filePath:file}); dialog.showOpenDialog = async () => ({canceled:false,filePaths:[file]}); dialog.showMessageBox = async () => ({response:1,checkboxChecked:false}); }, backupFile);
  await page.getByRole('button',{name:'Configurações',exact:true}).click();
  await page.getByRole('button',{name:'Criar backup',exact:true}).click();
  await page.getByRole('dialog').getByRole('status').filter({hasText:'Backup criado em:'}).waitFor();
  await page.getByRole('button',{name:'Fechar janela',exact:true}).click();
  await page.locator('textarea').fill('Mudança depois do backup');
  await page.getByRole('button',{name:'Salvar texto',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Salvo no computador'}).waitFor();
  await page.getByRole('button',{name:'Configurações',exact:true}).click();
  await page.getByRole('button',{name:'Restaurar backup',exact:true}).click();
  await page.getByRole('dialog').getByRole('status').filter({hasText:'Dados restaurados.'}).waitFor();
  assert.equal(await page.locator('textarea').inputValue(),'Rascunho privado');
  assert.equal((await page.evaluate(() => window.zamar.initial())).snapshot.black,true);
  await page.getByRole('button',{name:'Fechar janela',exact:true}).click();
  await app.close(); app = await launch(); page = await app.firstWindow();
  await page.waitForFunction(() => document.querySelector('textarea')?.value === 'Rascunho privado');
  const recovered = await page.evaluate(() => window.zamar.initial());
  assert.equal(recovered.snapshot.text,'[D]Mensagem pública');
  assert.equal(recovered.snapshot.black,true); assert.equal(recovered.snapshot.outputOpen,false);
  console.log('PASS: backup/restore through settings, invalid payload rejection, private data isolation, recovered presentation starts in black.');
  if (process.env.ZAMAR_SCREENSHOT) {
    await page.locator('textarea').fill('Vamos juntos cantar\nUma nova canção\n\nNossa voz vai ecoar\nNeste lugar');
    await page.getByRole('button',{name:'Salvar texto',exact:true}).click();
    await page.getByRole('status').filter({hasText:'Salvo no computador'}).waitFor();
    await page.screenshot({path:process.env.ZAMAR_SCREENSHOT,fullPage:false});
  }
  // Real song CRUD through the editor, including repeated section references.
  await page.getByRole('tab',{name:'Músicas',exact:true}).click();
  await page.getByRole('button',{name:'Nova música',exact:true}).click();
  await page.getByLabel('Título da música',{exact:true}).fill('Canção persistente');
  await page.getByLabel('Autor da música',{exact:true}).fill('João Teste');
  await page.getByLabel('Letra da seção',{exact:true}).fill('Verso inicial');
  await page.getByRole('button',{name:'Adicionar seção',exact:true}).click();
  await page.getByLabel('Nome da seção',{exact:true}).fill('Refrão');
  await page.getByLabel('Letra da seção',{exact:true}).fill('Coração original');
  await page.getByRole('button',{name:'Repetir seção selecionada',exact:true}).click();
  await page.getByLabel('Letra da seção',{exact:true}).fill('Coração atualizado');
  assert.equal(await page.locator('.slide-thumb').count(),3);
  await page.getByRole('button',{name:'Preparar bloco 3',exact:true}).click();
  assert.match(await page.getByLabel('Prévia do bloco selecionado',{exact:true}).innerText(),/Coração atualizado/);
  await page.getByRole('button',{name:'Salvar música',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Música salva no computador'}).waitFor();
  await app.close(); app = await launch(); page = await app.firstWindow();
  await page.getByRole('button',{name:/♪ Canção persistente João Teste/}).click();
  assert.equal(await page.locator('.sequence-list li').count(),3);
  await page.getByRole('button',{name:'Refrão',exact:true}).click();
  assert.equal(await page.getByLabel('Letra da seção',{exact:true}).inputValue(),'Coração atualizado');
  await page.getByLabel('Buscar na biblioteca',{exact:true}).fill('joao');
  assert.equal(await page.locator('.library-item').count(),1);
  await page.getByLabel('Buscar na biblioteca',{exact:true}).fill('coracao atualizado');
  assert.equal(await page.locator('.library-item').count(),1);
  await page.getByRole('button',{name:'Arquivar música',exact:true}).click();
  await page.getByRole('button',{name:'Salvar música',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Música salva no computador'}).waitFor();
  assert.equal(await page.locator('.library-item').count(),0);
  await page.getByLabel('Ver arquivadas',{exact:true}).check();
  assert.equal(await page.locator('.library-item').count(),1);
  await page.getByRole('button',{name:'Desarquivar música',exact:true}).click();
  await page.getByRole('button',{name:'Salvar música',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Música salva no computador'}).waitFor();
  await page.getByLabel('Ver arquivadas',{exact:true}).uncheck();
  await page.locator('#monitor').selectOption('rehearsal');
  await page.getByRole('button',{name:'Iniciar apresentação',exact:true}).click();
  await page.getByRole('button',{name:'Apresentar',exact:true}).click();
  await page.getByRole('button',{name:'Apresentar próximo bloco',exact:true}).click();
  assert.equal((await page.evaluate(()=>window.zamar.initial())).snapshot.text,'Coração atualizado');
  await page.getByRole('button',{name:'Apresentar bloco anterior',exact:true}).click();
  assert.equal((await page.evaluate(()=>window.zamar.initial())).snapshot.text,'Verso inicial');
  await page.getByRole('button',{name:'Ocultar texto',exact:true}).click();
  assert.equal((await page.evaluate(()=>window.zamar.initial())).snapshot.hidden,true);
  await page.getByRole('button',{name:'Mostrar texto',exact:true}).click();
  await page.getByRole('button',{name:'Editar conteúdo',exact:true}).click();
  await page.getByLabel('Buscar na biblioteca',{exact:true}).fill('');
  await page.getByRole('button',{name:/♪ Uma nova canção/}).click();
  assert.equal((await page.evaluate(()=>window.zamar.initial())).snapshot.text,'Verso inicial');
  await assert.rejects(()=>page.evaluate(()=>window.zamar.saveSong({id:'invalid'})));
  await page.getByLabel('Letra da seção',{exact:true}).fill(Array.from({length:25},(_,i)=>`Linha ${i} com coração e palavras para paginação`).join('\n'));
  const pages = await page.locator('.slide-thumb').count(); assert(pages>1);
  for(let i=0;i<pages;i++) {
    await page.getByRole('button',{name:`Preparar bloco ${i+1}`,exact:true}).click();
    const bounds=await page.locator('.prepared .slide-canvas').evaluate(el=>{
      const range=document.createRange();range.selectNodeContents(el);const text=range.getBoundingClientRect();const box=el.getBoundingClientRect();
      return {inside:text.left>=box.left && text.right<=box.right && text.top>=box.top && text.bottom<=box.bottom};
    });
    assert(bounds.inside,'Todos os slides longos devem caber na prévia sem recorte');
  }
  await page.getByRole('button',{name:'Salvar música',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Música salva no computador'}).waitFor();
  await page.getByRole('button',{name:'Modo apresentador',exact:true}).click();
  await page.evaluate(()=>window.scrollTo(0,0));
  const preparedBox = await page.locator('.prepared').boundingBox();
  const liveBox = await page.locator('.live-preview').boundingBox();
  assert(preparedBox.x+preparedBox.width<=liveBox.x,'Prévia e saída ao vivo devem ocupar colunas separadas');
  if(process.env.ZAMAR_SONG_SCREENSHOT) await page.screenshot({path:process.env.ZAMAR_SONG_SCREENSHOT});


  console.log('PASS: song creation/edit/reopen, section references, accent-insensitive author/lyrics search, archive/unarchive, explicit navigation, hide text and library selection isolation.');
  ({app,page}=await require('./program-flow.cjs')({app,page,launch,directory}));
  ({app,page}=await require('./bible-flow.cjs')({app,page,launch,directory}));
  ({app,page}=await require('./chord-flow.cjs')({app,page,launch,directory}));
  console.log('PASS: library example, prepared blocks, session queue, help and Bible flow dialogs.');
  console.log(`Format: ${format}; platform: ${process.platform}`);
  console.log('PASS: Electron application, SQLite reopen, accented portable path, isolated renderer, separate output, explicit presentation, blackout, rejected output command, simulated external monitor removal.');
 } finally { if(app) { await app.evaluate(({dialog}) => { dialog.showMessageBoxSync = () => 1; }).catch(() => {}); await app.close(); } rmSync(directory,{recursive:true,force:true}); }
})().catch(error => { console.error(error); process.exitCode=1; });
