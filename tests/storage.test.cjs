const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { Store, validateText } = require('../dist/main/storage.js');
test('SQLite preserves exact text, chords and accents after reopening in a path with accents', () => {
 const directory = mkdtempSync(join(tmpdir(), 'zamar-ação-'));
 try {
  let store = new Store(directory);
  const content = '[C]Uma canção\n[G/B]Coração e fé 🎵';
  store.save(content); store.close();
  store = new Store(directory); assert.equal(store.read(), content); store.close();
 } finally { rmSync(directory, { recursive: true, force: true }); }
});
test('IPC text validation rejects invalid and oversized payloads', () => {
 for (const value of [null, {}, 42, 'a'.repeat(100001)]) assert.throws(() => validateText(value));
 assert.equal(validateText('ação'), 'ação');
});

test('JSON backup exposes structured records and settings and restores attachments in another folder',()=>{
 const {readFileSync}=require('node:fs');const root=mkdtempSync(join(tmpdir(),'zamar-backup-json-'));let a,b;
 try{
  a=new Store(join(root,'a'));a.save('Canção com acentuação 🎵');a.setSetting('interface-theme','light');
  const now=new Date().toISOString();a.put({kind:'song',id:'json-song',title:'Título',data:{author:'',archived:false,sections:[{id:'v',label:'Verso',text:'Minha letra'}],sequence:['v']},createdAt:now,updatedAt:now});
  const image=a.addAsset('image.png','image/png',Buffer.from('synthetic image'));
  const file=join(root,'backup.json');a.createBackup(file);const raw=readFileSync(file,'utf8');const value=JSON.parse(raw);
  assert(raw.startsWith('{'));assert.equal(value.version,3);assert.equal(value.database,undefined);assert.equal(value.content.records[0].data.sections[0].text,'Minha letra');assert(value.content.settings.some(s=>s.key==='interface-theme'&&s.value==='light'));
  b=new Store(join(root,'b'));b.restoreBackup(file);assert.deepEqual(b.list('song'),a.list('song'));assert.equal(b.read(),a.read());assert.deepEqual(b.imageBytes(image.sha256),a.imageBytes(image.sha256));assert.equal(b.getSetting('interface-theme'),'light');
  const safety=JSON.parse(readFileSync(join(root,'b','backups',require('node:fs').readdirSync(join(root,'b','backups'))[0]),'utf8'));assert.equal(safety.version,3);
 }finally{a?.close();b?.close();rmSync(root,{recursive:true,force:true});}
});
test('invalid JSON, mutated content, duplicate settings and song catalogs never replace current data',()=>{
 const {readFileSync,writeFileSync}=require('node:fs');const {createHash}=require('node:crypto');const root=mkdtempSync(join(tmpdir(),'zamar-json-invalid-'));const store=new Store(root);
 try{
  store.save('Preservar');const file=join(root,'safe.json');store.createBackup(file);const original=readFileSync(file,'utf8');
  for(const input of ['{bad',JSON.stringify({format:'zamar-song-library',schemaVersion:1,songs:[]})]){writeFileSync(file,input);assert.throws(()=>store.restoreBackup(file));assert.equal(store.read(),'Preservar');}
  let value=JSON.parse(original);value.content.settings[0].value='Texto alterado';writeFileSync(file,JSON.stringify(value));assert.throws(()=>store.restoreBackup(file),/Integridade/);
  value=JSON.parse(original);value.content.settings.push(value.content.settings[0]);value.sha256=createHash('sha256').update(JSON.stringify(value.content)).digest('hex');writeFileSync(file,JSON.stringify(value));assert.throws(()=>store.restoreBackup(file),/duplicadas/);assert.equal(store.read(),'Preservar');
 }finally{store.close();rmSync(root,{recursive:true,force:true});}
});
test('legacy version 2 gzip backups remain readable and new exports require JSON extension',()=>{
 const {readFileSync,writeFileSync}=require('node:fs');const {createHash}=require('node:crypto');const {gzipSync}=require('node:zlib');const root=mkdtempSync(join(tmpdir(),'zamar-legacy-backup-'));let store;
 try{
  store=new Store(root);store.save('Legado');store.close();const bytes=readFileSync(join(root,'zamar.sqlite'));const file=join(root,'legacy.zamar-backup');writeFileSync(file,gzipSync(JSON.stringify({format:'zamar-backup',version:2,schemaVersion:2,files:[],database:{data:bytes.toString('base64'),sha256:createHash('sha256').update(bytes).digest('hex')}})));
  store=new Store(root);store.save('Atual');store.restoreBackup(file);assert.equal(store.read(),'Legado');assert.throws(()=>store.createBackup(join(root,'new.zamar-backup')),/\.json/);
 }finally{store?.close();rmSync(root,{recursive:true,force:true});}
});
