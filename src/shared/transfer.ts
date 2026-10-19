import { DEFAULT_MUSIC, parseChords, validateMusic, type Music } from './chords';
import { contentText, validateTextContent, type TextContent } from './content';
import { validateSong, type Song } from './songs';
export type ImportDraft={kind:'song'|'text';title:string;author:string;text:string;music:Music};
export type Duplicate={id:string;title:string;updatedAt:string;subtitle:string;revision:string;reason:'title'|'content'};
export type ImportChoice='new'|'ignore'|'copy'|'update';
export function validateImport(value:unknown):ImportDraft {
 const d=value as ImportDraft;if(!d||!['song','text'].includes(d.kind)||typeof d.title!=='string'||!d.title.trim()||d.title.length>200||typeof d.author!=='string'||d.author.length>200)throw new Error('Informe título e autor válidos para importar.');
 const text=contentText(d.text);if(!text.trim())throw new Error('O arquivo está vazio.');return {kind:d.kind,title:d.title.trim(),author:d.author.trim(),text,music:validateMusic(d.music)};
}
export function fileDraft(filename:string,text:string):ImportDraft {
 return {kind:/\.(pro|chordpro)$/i.test(filename)?'song':'text',title:filename.replace(/\.[^.]+$/,'').slice(0,200)||'Conteúdo importado',author:'',text:contentText(text.replace(/^\uFEFF/,'')),music:{...DEFAULT_MUSIC,mode:'chords'}};
}
export function importedContent(d:ImportDraft,id:string):Song|TextContent {
 return d.kind==='text'?validateTextContent({id,title:d.title,text:d.text}):validateSong({id,title:d.title,author:d.author,archived:false,sections:[{id:'imported',label:'Música importada',text:d.text}],sequence:['imported'],music:d.music});
}
export const normalized=(s:string)=>s.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR').replace(/\s+/g,' ').trim();
export function duplicateReason(d:ImportDraft,existing:Song|TextContent):Duplicate['reason']|null {
 if(normalized(d.title)===normalized(existing.title))return 'title';
 const text='sections' in existing?existing.sequence.map(id=>existing.sections.find(s=>s.id===id)?.text??'').join('\n\n'):existing.text;
 const plain=(s:string)=>d.kind==='song'?parseChords(s).lines.map(l=>l.lyric).join('\n'):s;
 const a=normalized(plain(d.text)),b=normalized(plain(text));return a&&a===b?'content':null;
}
