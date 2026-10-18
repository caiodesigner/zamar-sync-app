const {test}=require('node:test');
const assert=require('node:assert/strict');
const {mkdtempSync,rmSync}=require('node:fs');
const {join}=require('node:path');
const {tmpdir}=require('node:os');
const {validateSong,songRecord,readSong,searchSong}=require('../dist/shared/songs');
const {slidesForText}=require('../dist/shared/slides');
const {Store}=require('../dist/main/storage');
const song=()=>({id:'song',title:'Canção',author:'João',archived:false,sections:[{id:'v',label:'Verso',text:'Início'},{id:'c',label:'Refrão',text:'Coração'}],sequence:['v','c','c']});
test('song sections, sequence, archive and timestamps survive reopen and backup',()=>{
 const root=mkdtempSync(join(tmpdir(),'zamar-musicas-')); let store;
 try { store=new Store(join(root,'data'));let s=song();store.put(songRecord(s));const created=store.list('song')[0].createdAt;store.close();store=new Store(join(root,'data'));assert.deepEqual(readSong(store.list('song')[0]),s);
 s.sections[1].text='Refrão editado';s.archived=true;const updated=songRecord(s,store.list('song')[0]);store.put(updated);assert.equal(updated.createdAt,created);
 const file=join(root,'songs.zamar-backup');store.createBackup(file);s.title='Mudança';store.put(songRecord(s));store.restoreBackup(file);
 assert.equal(readSong(store.list('song')[0]).title,'Canção');assert.equal(readSong(store.list('song')[0]).archived,true);
 const restored=readSong(store.list('song')[0]);assert.deepEqual(restored.sequence.map(id=>restored.sections.find(s=>s.id===id).text),['Início','Refrão editado','Refrão editado']);
 } finally {store?.close();rmSync(root,{recursive:true,force:true});}
});
test('song validation rejects broken references, oversized content and invalid structure',()=>{
 for(const patch of [{title:''},{sections:[]},{sequence:['missing']},{sequence:[]},{sections:[{id:'c',label:'x',text:'a'},{id:'c',label:'x',text:'b'}]},{sections:[{id:'c',label:'x',text:'a'.repeat(100001)}]}]) assert.throws(()=>validateSong({...song(),...patch}));
 assert.equal(searchSong(song(),'joao'),true);assert.equal(searchSong(song(),'CORACAO'),true);assert.equal(searchSong(song(),'cancao'),true);assert.equal(searchSong(song(),'ausente'),false);
});
test('slides paginate long lines and preserve graphemes, words and explicit boundaries',()=>{
 assert.deepEqual(slidesForText('---\nInício\n---\n---\nFim\n---'),['Início','Fim']);
 assert.deepEqual(slidesForText('Primeiro\n---\nSegundo\n\nTerceiro'),['Primeiro','Segundo','Terceiro']);
 const text=Array.from({length:30},(_,i)=>`Linha ${i} com coração e fé`).join('\n');const pages=slidesForText(text);assert(pages.length>1);assert.equal(pages.join('\n'),text);assert(pages.every(p=>p.split('\n').length<=8));
 for(const long of ['x'.repeat(5000),'🎵'.repeat(100),'a\u0301'.repeat(100),'漢字'.repeat(80)]) {const result=slidesForText(long);assert.equal(result.map(p=>p.replaceAll('\n','')).join(''),long);assert(result.every(p=>p.split('\n').length<=8));}
 assert.equal(slidesForText('').length,0);assert.equal(slidesForText('a\r\n\r\nb').length,2);
});
