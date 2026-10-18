const {test}=require('node:test');const assert=require('node:assert/strict');
const {mkdtempSync,rmSync,readFileSync,writeFileSync,readdirSync}=require('node:fs');const {join}=require('node:path');const {tmpdir}=require('node:os');const {DatabaseSync}=require('node:sqlite');const {gzipSync}=require('node:zlib');const {createHash}=require('node:crypto');
const {Store}=require('../dist/main/storage');const {DEFAULT_THEME,validateTheme,validateProgram,contentRecord,readContent}=require('../dist/shared/content');const {slidesForText}=require('../dist/shared/slides');const {imageDimensions}=require('../dist/main/images');
const fixture=fn=>{const root=mkdtempSync(join(tmpdir(),'zamar-culto-'));try{fn(root);}finally{rmSync(root,{recursive:true,force:true});}};
const item=()=>({id:'entry',title:'Canção',text:'Texto original',source:{kind:'song',id:'song'},theme:{...DEFAULT_THEME}});
function legacy(root){const db=new DatabaseSync(join(root,'zamar.sqlite'));db.exec("CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE records(kind TEXT NOT NULL CHECK(kind IN ('song','program','theme','bible-version')),id TEXT NOT NULL,title TEXT NOT NULL,payload TEXT NOT NULL CHECK(json_valid(payload)),created_at TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(kind,id));CREATE INDEX records_title ON records(kind,title COLLATE NOCASE);CREATE TABLE assets(id TEXT PRIMARY KEY,name TEXT NOT NULL,media_type TEXT NOT NULL,sha256 TEXT NOT NULL,size INTEGER NOT NULL CHECK(size>=0));PRAGMA user_version=1;");db.prepare('INSERT INTO settings VALUES (?,?)').run('draft','Legado 🎵');db.close();}
test('schema 1 migrates with recovery copy; old backups restore into schema 2',()=>fixture(root=>{
 legacy(root);const original=readFileSync(join(root,'zamar.sqlite'));const old=join(root,'old.zamar-backup');writeFileSync(old,gzipSync(JSON.stringify({format:'zamar-backup',version:1,schemaVersion:1,files:[],database:{sha256:createHash('sha256').update(original).digest('hex'),data:original.toString('base64')}})));
 const store=new Store(root);try{assert.equal(store.read(),'Legado 🎵');assert.equal(readdirSync(join(root,'backups')).length,1);store.put(contentRecord('text',{id:'t',title:'Aviso',text:'Teste'}));store.restoreBackup(old);assert.equal(store.read(),'Legado 🎵');assert.equal(store.list('text').length,0);}finally{store.close();}
}));
test('program snapshots and text/theme persist independently and restore with image assets',()=>fixture(root=>{
 let store=new Store(root);const asset=store.addAsset('fundo.png','image/png',Buffer.from('fixture de integridade'));const theme={...DEFAULT_THEME,id:'blue',title:'Azul',background:'#123456',image:asset.sha256,ratio:'4:3'};
 const program={id:'culto',title:'Domingo',items:[{...item(),theme},{...item(),id:'second',source:{kind:'text',id:'t'}}]};
 store.put(contentRecord('text',{id:'t',title:'Aviso',text:'Original'}));store.put(contentRecord('theme',theme));store.put(contentRecord('program',program));store.setSetting('last-program','culto');store.close();store=new Store(root);
 try{assert.deepEqual(readContent('program',store.list('program')[0]),program);store.put(contentRecord('text',{id:'t',title:'Aviso',text:'Editado'}));store.put(contentRecord('theme',{...theme,background:'#ffffff'}));assert.deepEqual(readContent('program',store.list('program')[0]),program);
 const backup=join(root,'culto.zamar-backup');store.createBackup(backup);store.put(contentRecord('program',{...program,items:[...program.items].reverse()}));store.restoreBackup(backup);assert.deepEqual(readContent('program',store.list('program')[0]),program);assert.equal(store.imageBytes(asset.sha256).toString(),'fixture de integridade');assert.equal(store.getSetting('last-program'),'culto');
 }finally{store.close();}
}));
test('invalid program/theme and unsafe file references are rejected',()=>{
 for(const patch of [{image:'../../etc/passwd'},{image:'https://host/image.png'},{margin:0},{margin:99},{fontSize:NaN},{background:'red'},{background:['#ffffff']},{ratio:'auto'},{overlay:3},{font:'remote-font'}])assert.throws(()=>validateTheme({...DEFAULT_THEME,...patch}));
 for(const items of [[item(),item()],[{...item(),source:{kind:'text',id:'../t'}}],[{...item(),text:'a'.repeat(100001)}]])assert.throws(()=>validateProgram({id:'p',title:'Culto',items}));
});
test('pagination respects every supported ratio/font and margin without losing text',()=>{
 const text='Coração 🎵 e uma palavra'.repeat(100);
 for(const ratio of ['16:9','4:3'])for(const font of ['mono','sans'])for(const fontSize of [32,56,96])for(const margin of [5,15]){const pages=slidesForText(text,{...DEFAULT_THEME,ratio,font,fontSize,margin});assert(pages.length>1);assert.equal(pages.join('').replaceAll('\n',''),text);}
});
test('raster preflight bounds dimensions and rejects SVG/truncated files',()=>{
 const png=Buffer.alloc(24);Buffer.from([137,80,78,71,13,10,26,10]).copy(png);png.write('IHDR',12);png.writeUInt32BE(1920,16);png.writeUInt32BE(1080,20);assert.deepEqual(imageDimensions(png),{width:1920,height:1080});png.writeUInt32BE(50000,16);assert.throws(()=>imageDimensions(png));assert.deepEqual(imageDimensions(Buffer.from([255,216,255,192,0,8,8,4,56,7,128,3,255,217])),{width:1920,height:1080});assert.throws(()=>imageDimensions(Buffer.from('<svg/>')));assert.throws(()=>imageDimensions(Buffer.from([255,216,255,192,0,2])));
});
