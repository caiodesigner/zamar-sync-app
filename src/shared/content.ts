import { type EntityKind, type LibraryRecord, validateRecord } from './models';
export type Theme = { id:string; title:string; ratio:'16:9'|'4:3'; background:string; foreground:string; image:string|null; overlay:number; font:'mono'|'sans'; fontSize:number; margin:number; align:'left'|'center'|'right' };
export type TextContent = { id:string; title:string; text:string };
export type ProgramItem = { id:string; title:string; text:string; source:{kind:'song'|'text';id:string}|null; theme:Theme };
export type Program = { id:string; title:string; items:ProgramItem[] };
export type ContentKind = 'text'|'theme'|'program';
export type Content = TextContent|Theme|Program;
export type Catalog = { texts:TextContent[]; themes:Theme[]; programs:Program[]; lastProgram:string|null; skipped:number };
export const DEFAULT_THEME:Theme = {id:'default',title:'Padrão',ratio:'16:9',background:'#000000',foreground:'#ffffff',image:null,overlay:0.4,font:'mono',fontSize:56,margin:6,align:'center'};
const validId=(v:unknown):v is string=>typeof v==='string' && /^[a-zA-Z0-9_-]{1,100}$/.test(v);
function header(v:unknown): asserts v is {id:string;title:string} {
 if(!v || typeof v!=='object' || !validId((v as Content).id) || typeof (v as Content).title!=='string' || !(v as Content).title.trim() || (v as Content).title.length>200) throw new Error('Informe um título válido, de até 200 caracteres.');
}
export function contentText(v:unknown):string { if(typeof v!=='string' || v.length>100000) throw new Error('Texto inválido ou acima de 100 mil caracteres.');return v; }
export function validateTheme(value:unknown):Theme {
 header(value);const t=value as Theme;
 if(!['16:9','4:3'].includes(t.ratio) || typeof t.background!=='string' || !/^#[0-9a-f]{6}$/i.test(t.background) || typeof t.foreground!=='string' || !/^#[0-9a-f]{6}$/i.test(t.foreground) || (t.image!==null && (typeof t.image!=='string' || !/^[a-f0-9]{64}$/.test(t.image))) || !['mono','sans'].includes(t.font) || !['left','center','right'].includes(t.align) || !Number.isFinite(t.fontSize) || t.fontSize<32 || t.fontSize>96 || !Number.isFinite(t.margin) || t.margin<5 || t.margin>15 || !Number.isFinite(t.overlay) || t.overlay<0 || t.overlay>0.8) throw new Error('Tema inválido. Confira cores, proporção, fonte e margens.');
 return {id:t.id,title:t.title.trim(),ratio:t.ratio,background:t.background,foreground:t.foreground,image:t.image,overlay:t.overlay,font:t.font,fontSize:t.fontSize,margin:t.margin,align:t.align};
}
export function validateTextContent(value:unknown):TextContent {header(value);const t=value as TextContent;return {id:t.id,title:t.title.trim(),text:contentText(t.text)};}
export function validateItem(value:unknown):ProgramItem {
 header(value);const i=value as ProgramItem;const source=i.source;
 if(source!==null && (!source || !['song','text'].includes(source.kind) || !validId(source.id)))throw new Error('Origem de item inválida.');
 return {id:i.id,title:i.title.trim(),text:contentText(i.text),source:source ? {kind:source.kind,id:source.id}:null,theme:validateTheme(i.theme)};
}
export function validateProgram(value:unknown):Program {
 header(value);const p=value as Program;
 if(!Array.isArray(p.items) || p.items.length>100)throw new Error('Uma programação admite até 100 itens.');
 const items=p.items.map(validateItem);
 if(new Set(items.map(i=>i.id)).size!==items.length || items.reduce((n,i)=>n+i.text.length,0)>500000)throw new Error('Itens duplicados ou programação acima de 500 mil caracteres.');
 return {id:p.id,title:p.title.trim(),items};
}
export function validateContent(kind:ContentKind,value:unknown):Content {
 if(kind==='text')return validateTextContent(value);if(kind==='theme')return validateTheme(value);if(kind==='program')return validateProgram(value);throw new Error('Tipo de cadastro inválido.');
}
export function contentRecord(kind:ContentKind,value:unknown,existing?:LibraryRecord):LibraryRecord {
 const content=validateContent(kind,value);const now=new Date().toISOString();
 return validateRecord({id:content.id,kind:kind as EntityKind,title:content.title,data:{...content,schemaVersion:1},createdAt:existing?.createdAt??now,updatedAt:now});
}
export function readContent(kind:ContentKind,record:LibraryRecord):Content {return validateContent(kind,{...record.data,id:record.id,title:record.title});}
export function slideGeometry(theme:Theme) {
 const width=1600;const height=theme.ratio==='4:3'?1200:900;
 const x=width*theme.margin/100;const y=height*theme.margin/100;
 return {width,height,x,y,innerWidth:width-2*x,innerHeight:height-2*y};
}
export const imageUrl=(hash:string)=>`zamar-asset://image/${hash}`;
