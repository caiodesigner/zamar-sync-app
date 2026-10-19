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
