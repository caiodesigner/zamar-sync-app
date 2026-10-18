const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, readFileSync, writeFileSync, readdirSync, chmodSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { DatabaseSync } = require('node:sqlite');
const { spawnSync } = require('node:child_process');
const { gzipSync, gunzipSync } = require('node:zlib');
const { Store } = require('../dist/main/storage.js');
const { requestPayload, initialPresentation } = require('../dist/main/protocol.js');
function fixture(action) { const root=mkdtempSync(join(tmpdir(),'zamar-dados-ação-')); try { return action(root); } finally { rmSync(root,{recursive:true,force:true}); } }
function record(kind,id) { return {kind,id,title:`Título ${id}`,data:{sections:[{id:'chorus',lines:['Coração e fé'],chords:[{line:0,offset:0,symbol:'C/G'}]}],sequence:['chorus','chorus'],originalKey:'C'},createdAt:'2026-10-18T00:00:00.000Z',updatedAt:'2026-10-18T00:00:00.000Z'}; }
test('legacy migration preserves draft, creates recovery copy and refuses future schema without changing it',()=>fixture(root=>{
 let db=new DatabaseSync(join(root,'zamar.sqlite'));
 db.exec('CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
 db.prepare('INSERT INTO settings VALUES (?,?)').run('draft','Rascunho anterior');db.close();
 let store=new Store(root);assert.equal(store.read(),'Rascunho anterior');store.close();
 assert.equal(readdirSync(join(root,'backups')).filter(n=>n.endsWith('.sqlite')).length,1);
 db=new DatabaseSync(join(root,'zamar.sqlite'));assert.equal(db.prepare('PRAGMA user_version').get().user_version,2);db.exec('PRAGMA user_version=99');db.close();
 const before=readFileSync(join(root,'zamar.sqlite'));assert.throws(()=>new Store(root),/futura/);assert.deepEqual(readFileSync(join(root,'zamar.sqlite')),before);
}));
test('repositories persist aggregates with accents, repeated sections and independent kinds',()=>fixture(root=>{
 let store=new Store(root);
 for(const kind of ['song','theme','program','bible-version']) store.put(record(kind,'same-id'));
 assert.throws(()=>store.put({...record('song','x'),title:''}));
 assert.throws(()=>store.put({...record('song','invalid'),data:new Date()}));
 assert.throws(()=>store.put({...record('song','invalid'),data:{value:NaN}}));
 assert.throws(()=>store.list('unknown'));
 store.close();store=new Store(root);
 try { for(const kind of ['song','theme','program','bible-version']) assert.deepEqual(store.list(kind),[record(kind,'same-id')]); } finally {store.close();}
}));
test('backup restores database and attachments into empty directory and protects previous state',()=>fixture(root=>{
 const a=new Store(join(root,'origem')), b=new Store(join(root,'destino')), empty=new Store(join(root,'vazio'));
 try {
  a.save('Letra e cifra [G/B]'); for(const kind of ['song','theme','program','bible-version']) a.put(record(kind,'music'));
  const asset=a.addAsset('fundo.txt','text/plain',Buffer.from('Anexo com acentuação'));
  const file=join(root,'library.zamar-backup');a.createBackup(file);
  empty.restoreBackup(file); assert.equal(empty.read(),'Letra e cifra [G/B]');
  for(const kind of ['song','theme','program','bible-version']) assert.deepEqual(empty.list(kind),[record(kind,'music')]);
  assert.equal(readFileSync(join(root,'vazio','assets',asset.sha256),'utf8'),'Anexo com acentuação');
  b.save('Texto anterior');const rollback=b.restoreBackup(file);
  assert.equal(b.read(),'Letra e cifra [G/B]');assert.deepEqual(b.list('song'),[record('song','music')]);
  assert.equal(readFileSync(join(root,'destino','assets',asset.sha256),'utf8'),'Anexo com acentuação');
  b.restoreBackup(rollback);assert.equal(b.read(),'Texto anterior');assert.equal(b.list('song').length,0);
  assert.throws(()=>a.createBackup(join(root,'origem','zamar.sqlite')),/extensão/);
 } finally {a.close();b.close();empty.close();}
}));
test('tampered backup, manifest traversal, and invalid source leave current data untouched',()=>fixture(root=>{
 const store=new Store(root);
 try {
  store.save('Preservar');const file=join(root,'valid.zamar-backup');store.createBackup(file);
  const envelope=JSON.parse(gunzipSync(readFileSync(file)));
  envelope.database.sha256='0'.repeat(64);writeFileSync(join(root,'invalid.zamar-backup'),gzipSync(JSON.stringify(envelope)));
  assert.throws(()=>store.restoreBackup(join(root,'invalid.zamar-backup')),/Integridade/);
  const unsafe=JSON.parse(gunzipSync(readFileSync(file)));unsafe.files=[{sha256:'../../escape',data:'eA=='}];writeFileSync(join(root,'unsafe.zamar-backup'),gzipSync(JSON.stringify(unsafe)));
  assert.throws(()=>store.restoreBackup(join(root,'unsafe.zamar-backup')));
  assert.equal(store.read(),'Preservar');
 } finally {store.close();}
}));
test('active store blocks another opener; dead process lock is recovered',()=>fixture(root=>{
 const store=new Store(root);assert.throws(()=>new Store(root),/outra instância/);store.close();
 const child=spawnSync(process.execPath,['-e',`const {Store}=require(${JSON.stringify(resolve('dist/main/storage.js'))}); new Store(${JSON.stringify(root)}); process.exit(0);`]);assert.equal(child.status,0);
 const reopened=new Store(root);reopened.save('Recuperado');reopened.close();
}));
test('unwritable directory fails without writing an alternative location',{skip:process.platform==='win32'||process.getuid?.()===0},()=>fixture(root=>{
 chmodSync(root,0o500);try {assert.throws(()=>new Store(root));}finally{chmodSync(root,0o700);}
}));
test('IPC version, text, and recoverable presentation are validated',()=>{
 for(const input of [undefined,null,[],{}, {version:2,payload:null}]) assert.throws(()=>requestPayload(input));
 assert.equal(requestPayload({version:1,payload:'ok'}),'ok');
 assert.deepEqual(initialPresentation(JSON.stringify({text:'Último slide',revision:12})),{text:'Último slide',revision:13,theme:require('../dist/shared/content').DEFAULT_THEME,hidden:false,black:true,outputOpen:false,mode:'closed',status:'Saída fechada; conteúdo preservado para retomada explícita'});
 assert.equal(initialPresentation('{broken').text,'');
});

test('restore rolls back all database changes if insertion fails mid-transaction',()=>fixture(root=>{
 const store=new Store(root);
 try {
  store.save('Antes');store.put(record('song','backup-song'));
  const file=join(root,'rollback.zamar-backup');store.createBackup(file);
  store.save('Estado atual');store.put(record('song','current-song'));
  const original=store.put; store.put=()=>{throw new Error('Falha simulada de gravação');};
  assert.throws(()=>store.restoreBackup(file),/simulada/);store.put=original;
  assert.equal(store.read(),'Estado atual');assert.equal(store.list('song').length,2);
 } finally {store.close();}
}));
