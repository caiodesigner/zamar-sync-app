import { validateSong, type Song } from './songs';
export type LibrarySong = Song & { review: { status:string; issues:string[] }; source: { slides:number[] } };
export type SongLibrary = { format:'zamar-song-library'; schemaVersion:1; name:string; songs:LibrarySong[] };
export type LibrarySelection = { token:string; name:string; songs:(LibrarySong & {exists:boolean;similar:boolean})[] };
export function validateSongLibrary(value:unknown):SongLibrary {
 const v=value as SongLibrary;
 if(!v || v.format!=='zamar-song-library' || v.schemaVersion!==1 || typeof v.name!=='string' || v.name.length>200 || !Array.isArray(v.songs) || !v.songs.length || v.songs.length>2000)throw new Error('Catálogo de músicas inválido ou versão não suportada.');
 const ids=new Set<string>();
 const songs=v.songs.map(raw=>{
  const song=validateSong(raw);if(ids.has(song.id))throw new Error('Identificadores repetidos no catálogo.');ids.add(song.id);
  if(!song.sections.some(s=>s.text.trim()))throw new Error('Música sem letra no catálogo.');
  const issues=raw.review?.issues??[];
  if(!Array.isArray(issues)||issues.length>100||issues.some(x=>typeof x!=='string'||x.length>2000))throw new Error('Alertas inválidos no catálogo.');
  const slides=raw.source?.slides??[];
  if(!Array.isArray(slides)||slides.length>2000||slides.some(n=>!Number.isInteger(n)||n<1))throw new Error('Origem inválida no catálogo.');
  return {...song,review:{status:raw.review?.status==='reviewed'?'reviewed':'pending',issues},source:{slides}};
 });return {format:v.format,schemaVersion:1,name:v.name,songs};
}
