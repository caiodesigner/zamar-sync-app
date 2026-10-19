import { parseChords, DEFAULT_MUSIC } from '../shared/chords';
import { readFileSync,statSync,mkdirSync,writeFileSync,renameSync,rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Store } from './storage';
import { validateSongLibrary, type SongLibrary, type LibrarySelection } from '../shared/song-library';
import { readSong,songRecord } from '../shared/songs';
import { normalized } from '../shared/transfer';
export class SongLibraryImport {
 private stage:{token:string;library:SongLibrary}|null=null;
 constructor(private store:Store){}
 reset(){this.stage=null;}
 select(path:string):LibrarySelection {
  this.reset();if(statSync(path).size>10*1024*1024)throw new Error('Catálogo acima de 10 MiB.');
  const bytes=readFileSync(path);if(bytes.length>10*1024*1024)throw new Error('Catálogo acima de 10 MiB.');
  const library=validateSongLibrary(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/^\uFEFF/,'')));
  const token=randomUUID();this.stage={token,library};const existing=this.store.list('song');
  const titles=new Set(existing.map(s=>normalized(s.title)));const ids=new Set(existing.map(s=>s.id));
  const counts=new Map<string,number>();for(const s of library.songs)counts.set(normalized(s.title),(counts.get(normalized(s.title))??0)+1);
  return {token,name:library.name,songs:library.songs.map(s=>({...s,exists:ids.has(s.id),similar:titles.has(normalized(s.title))||(counts.get(normalized(s.title))??0)>1}))};
 }
 confirm(token:unknown,ids:unknown,ack:unknown){
  if(!this.stage||token!==this.stage.token)throw new Error('Selecione novamente o catálogo.');
  if(ack!==true||!Array.isArray(ids)||!ids.length||ids.length>2000||ids.some(id=>typeof id!=='string')||new Set(ids).size!==ids.length)throw new Error('Selecione músicas e confirme a revisão do lote.');
  const chosen=this.stage.library.songs.filter(s=>ids.includes(s.id));if(chosen.length!==ids.length)throw new Error('Seleção inválida.');
  const existing=new Set(this.store.list('song').map(s=>s.id));const pending=chosen.filter(s=>!existing.has(s.id));
  if(!pending.length)throw new Error('As músicas selecionadas já estão cadastradas.');
  const folder=join(this.store.directory,'backups');mkdirSync(folder,{recursive:true});const backup=join(folder,`before-song-library-${Date.now()}-${randomUUID()}.json`);this.store.createBackup(backup);
  this.store.atomic(()=>{for(const song of pending)this.store.put(songRecord(song));});
  this.reset();return {count:pending.length,skipped:chosen.length-pending.length,first:readSong(this.store.list('song').find(s=>s.id===pending[0].id)!),backup};
 }
}

export function songExportCatalog(store:Store,kind:unknown){
 if(kind!=='lyrics'&&kind!=='chords')throw new Error('Tipo de exportação inválido.');
 const songs=store.list('song').map(readSong).filter(song=>kind==='lyrics'||song.sections.some(s=>parseChords(s.text).lines.some(line=>line.anchors.length)));
 if(!songs.length)throw new Error(kind==='lyrics'?'Nenhuma música cadastrada para exportar.':'Nenhuma música com cifras cadastrada para exportar.');
 const catalog=validateSongLibrary({format:'zamar-song-library',schemaVersion:1,name:kind==='lyrics'?'Letras de músicas':'Cifras de músicas',songs:songs.map(song=>({...song,sections:song.sections.map(section=>({...section,text:kind==='lyrics'?parseChords(section.text).lines.map(line=>line.lyric).join('\n'):section.text})),music:{...(song.music??DEFAULT_MUSIC),mode:kind==='lyrics'?'lyrics':'chords'}}))});
 return {...catalog,exportKind:kind,createdAt:new Date().toISOString()};
}
export function writeSongExport(store:Store,kind:unknown,destination:string){
 if(!destination.toLowerCase().endsWith('.json'))throw new Error('Escolha um arquivo .json.');
 const catalog=songExportCatalog(store,kind);const bytes=Buffer.from(JSON.stringify(catalog,null,2)+'\n');
 if(bytes.length>10*1024*1024)throw new Error('Catálogo acima de 10 MiB.');
 const temporary=destination+'.'+randomUUID()+'.tmp';
 try{writeFileSync(temporary,bytes,{flag:'wx',mode:0o600});renameSync(temporary,destination);}finally{rmSync(temporary,{force:true});}
 return {path:destination,count:catalog.songs.length};
}
