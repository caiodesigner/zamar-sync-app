import { readFileSync,statSync,mkdirSync } from 'node:fs';
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
  const folder=join(this.store.directory,'backups');mkdirSync(folder,{recursive:true});const backup=join(folder,`before-song-library-${Date.now()}-${randomUUID()}.zamar-backup`);this.store.createBackup(backup);
  this.store.atomic(()=>{for(const song of pending)this.store.put(songRecord(song));});
  this.reset();return {count:pending.length,skipped:chosen.length-pending.length,first:readSong(this.store.list('song').find(s=>s.id===pending[0].id)!),backup};
 }
}
