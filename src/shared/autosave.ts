import { validateSong, type Song } from './songs';
import { validateContent, contentText, type Content, type ContentKind } from './content';
export type SaveKind=ContentKind|'song'|'draft';
export type AutoEntry={kind:SaveKind;value:Song|Content|string;base:string|null};
export type SaveReceipt={at:string;entries:AutoEntry[]};
export function validateAutoEntries(value:unknown):AutoEntry[] {
 if(!Array.isArray(value)||!value.length||value.length>5)throw new Error('Lote de salvamento inválido.');
 const kinds=new Set<string>();return value.map((e:AutoEntry)=>{if(!e||!['song','text','program','theme','draft'].includes(e.kind)||kinds.has(e.kind)||!(e.base===null||typeof e.base==='string'&&e.base.length<=1000000))throw new Error('Entrada de salvamento inválida.');kinds.add(e.kind);return {kind:e.kind,base:e.base,value:e.kind==='draft'?contentText(e.value):e.kind==='song'?validateSong(e.value):validateContent(e.kind,e.value)};});
}
