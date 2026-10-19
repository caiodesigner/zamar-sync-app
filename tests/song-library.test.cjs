const {test}=require('node:test');const assert=require('node:assert/strict');
const {readFileSync,mkdtempSync,writeFileSync,rmSync,readdirSync}=require('node:fs');const {tmpdir}=require('node:os');const {join}=require('node:path');
const {Store}=require('../dist/main/storage');const {SongLibraryImport}=require('../dist/main/song-library');const {validateSongLibrary}=require('../dist/shared/song-library');
const catalog=JSON.parse(readFileSync('library/encontro/songs.json','utf8'));
test('Encontro catalog conforms to song schema and accounts for every slide without losing lyric lines',()=>{
 const library=validateSongLibrary(catalog);assert.equal(library.songs.length,232);
 const source=JSON.parse(readFileSync('library/encontro/source-slides.json','utf8'));assert.deepEqual(catalog.source,source.source);assert.equal(source.slides.length,981);
 const assigned=new Map();for(const song of catalog.songs){
  for(const n of song.source.slides){assert(!assigned.has(n));assigned.set(n,song);}
  assert.deepEqual(song.sequence,song.sections.map(s=>s.id));assert.equal(song.review.status,'pending');
 }
 const empty=new Set(catalog.excludedSlides.map(s=>s.slide));assert.equal(empty.size,4);
 for(const slide of source.slides){
  if(!slide.lines.length){assert(empty.has(slide.slide));continue;}
  const song=assigned.get(slide.slide);assert(song,`Unassigned slide ${slide.slide}`);
  let lines=[...slide.lines];if(slide.slide===song.source.firstSlide){for(const title of song.source.removedTitleLines??[])assert.equal(lines.shift(),title);}
  if(slide.slide===113)lines[0]=lines[0].replace(/^28\s*\.\s*/,'');
  assert.equal(song.sections.find(s=>s.id===`slide-${slide.slide}`).text,lines.join('\n'));
 }
 assert.equal(assigned.size+empty.size,981);
 assert.equal(catalog.songs.filter(s=>s.review.issues.length).length,36);
});
test('catalog batch imports all songs atomically, preserves edits on reimport, and supports subset selection',()=>{
 const root=mkdtempSync(join(tmpdir(),'zamar-library-'));const store=new Store(root);const importer=new SongLibraryImport(store);
 try{
  let selection=importer.select('library/encontro/songs.json');assert.equal(selection.songs.length,232);assert(selection.songs.some(s=>s.similar));
  assert.throws(()=>importer.confirm(selection.token,[selection.songs[0].id],false),/confirme/);assert.equal(store.list('song').length,0);
  let result=importer.confirm(selection.token,[selection.songs[0].id],true);assert.equal(result.count,1);assert.equal(result.first.sections[0].text,catalog.songs[0].sections[0].text);assert.equal(readdirSync(join(root,'backups')).length,1);
  assert.throws(()=>importer.confirm(selection.token,[selection.songs[1].id],true),/novamente/);
  selection=importer.select('library/encontro/songs.json');assert(selection.songs[0].exists);
  result=importer.confirm(selection.token,selection.songs.map(s=>s.id),true);assert.equal(result.count,231);assert.equal(result.skipped,1);assert.equal(store.list('song').length,232);
  const edited=store.list('song')[0];edited.title='Edição preservada';store.put(edited);
  selection=importer.select('library/encontro/songs.json');assert.throws(()=>importer.confirm(selection.token,selection.songs.map(s=>s.id),true),/já estão/);assert.equal(store.list('song').find(s=>s.id===edited.id).title,'Edição preservada');
 }finally{store.close();rmSync(root,{recursive:true,force:true});}
});
test('invalid catalog and injected mid-batch failure never leave a partial song library',()=>{
 const root=mkdtempSync(join(tmpdir(),'zamar-library-rollback-'));const store=new Store(root);const importer=new SongLibraryImport(store);
 try{
  const invalid=join(root,'invalid.json');writeFileSync(invalid,JSON.stringify({...catalog,songs:[catalog.songs[0],catalog.songs[0]]}));assert.throws(()=>importer.select(invalid),/repetidos/);
  const selection=importer.select('library/encontro/songs.json');const original=store.put.bind(store);let calls=0;
  store.put=value=>{if(++calls===2)throw new Error('Injected storage failure');return original(value);};
  assert.throws(()=>importer.confirm(selection.token,selection.songs.slice(0,3).map(s=>s.id),true),/Injected/);assert.equal(store.list('song').length,0);assert.equal(readdirSync(join(root,'backups')).length,1);
 }finally{store.close();rmSync(root,{recursive:true,force:true});}
});

test('separate lyric and chord JSON exports exclude Bibles and attachments and preserve the local songs',()=>{
 const {songExportCatalog,writeSongExport}=require('../dist/main/song-library');const {songRecord}=require('../dist/shared/songs');
 const root=mkdtempSync(join(tmpdir(),'zamar-export-songs-'));const store=new Store(root);
 try{
  const plain={...catalog.songs[0],id:'plain'};const chords={...catalog.songs[1],id:'chords',sections:[{id:'verse',label:'Verso',text:'[C]Coração [G/B]e fé\n[Am]Outra linha'}],sequence:['verse'],music:{originalKey:'C',targetKey:'D',accidentals:'flat',mode:'lyrics'}};
  store.put(songRecord(plain));store.put(songRecord(chords));const now=new Date().toISOString();store.put({kind:'bible-version',id:'private-bible',title:'Bíblia privada',data:{privateMarker:'never-export-this'},createdAt:now,updatedAt:now});store.addAsset('image.png','image/png',Buffer.from('private-attachment'));
  const before=store.list('song');const lyrics=songExportCatalog(store,'lyrics');assert.equal(lyrics.songs.length,2);const exported=lyrics.songs.find(s=>s.id==='chords');assert.equal(exported.sections[0].text,'Coração e fé\nOutra linha');assert.equal(exported.music.mode,'lyrics');
  const cif=songExportCatalog(store,'chords');assert.equal(cif.songs.length,1);assert.equal(cif.songs[0].sections[0].text,chords.sections[0].text);assert.equal(cif.songs[0].music.targetKey,'D');assert.equal(cif.songs[0].music.mode,'chords');
  const path=join(root,'letras.json');writeSongExport(store,'lyrics',path);const raw=readFileSync(path,'utf8');assert(!raw.includes('private-bible'));assert(!raw.includes('private-attachment'));assert(!raw.includes('files'));assert.equal(validateSongLibrary(JSON.parse(raw)).songs.length,2);assert.deepEqual(store.list('song'),before);
  assert.throws(()=>songExportCatalog(store,'bible'),/inválido/);
 }finally{store.close();rmSync(root,{recursive:true,force:true});}
});
test('chord export reports an empty collection without creating a file',()=>{
 const {writeSongExport}=require('../dist/main/song-library');const {songRecord}=require('../dist/shared/songs');const {existsSync}=require('node:fs');
 const root=mkdtempSync(join(tmpdir(),'zamar-export-empty-'));const store=new Store(root);
 try{store.put(songRecord(catalog.songs[0]));const file=join(root,'cifras.json');assert.throws(()=>writeSongExport(store,'chords',file),/Nenhuma música com cifras/);assert.equal(existsSync(file),false);}finally{store.close();rmSync(root,{recursive:true,force:true});}
});
