import { slideGeometry, type Theme } from './content';
export type Music = { originalKey:string; targetKey:string; accidentals:'sharp'|'flat'; mode:'lyrics'|'chords' };
export type ChordLine = { lyric:string; anchors:{position:number;token:string}[] };
export type ChordPage = { lines:ChordLine[] };
export const KEYS=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','Db','Eb','Gb','Ab','Bb'];
export const DEFAULT_MUSIC:Music={originalKey:'C',targetKey:'C',accidentals:'sharp',mode:'lyrics'};
export function validateMusic(value:unknown):Music {
 const m=value as Music;if(!m || !KEYS.includes(m.originalKey)||!KEYS.includes(m.targetKey)||!['sharp','flat'].includes(m.accidentals)||!['lyrics','chords'].includes(m.mode))throw new Error('Configuração de cifras inválida.');
 return {originalKey:m.originalKey,targetKey:m.targetKey,accidentals:m.accidentals,mode:m.mode};
}
const notes:Record<string,number>={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,Fb:4,'E#':5,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11,Cb:11,'B#':0};
export function transpose(token:string,m:Music):{token:string;known:boolean} {
 const match=/^([A-G](?:#|b)?)([^/]*)(?:\/([A-G](?:#|b)?))?$/.exec(token);
 if(!match)return {token,known:false};
 const root=match[1],suffix=match[2],bass=match[3];
 const qualifier=/(?:maj|min|dim|aug|sus[24]?|add[2469]|m|[0-9]+|[#b][0-9]+|\([#b0-9,+-]+\)|[+-])/y;
 let cursor=0;while(cursor<suffix.length){qualifier.lastIndex=cursor;const part=qualifier.exec(suffix);if(!part)return {token,known:false};cursor=qualifier.lastIndex;}
 const shift=notes[m.targetKey]-notes[m.originalKey];const names=m.accidentals==='flat'?['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']:['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
 const change=(n:string)=>names[(notes[n]+shift+12)%12];return {token:change(root)+suffix+(bass?'/'+change(bass):''),known:true};
}
// Positions are UTF-16 offsets into the unmodified lyric; grapheme boundaries are kept.
export function parseChords(text:string):{lines:ChordLine[];warnings:string[]} {
 const warnings=new Set<string>();const lines=text.replace(/\r\n?/g,'\n').replace(/\t/g,'    ').split('\n').map(raw=>{
  let lyric='';const anchors:ChordLine['anchors']=[];let cursor=0;
  for(const match of raw.matchAll(/\[([^\[\]\n]{1,80})\]/g)){lyric+=raw.slice(cursor,match.index);const token=match[1];anchors.push({position:lyric.length,token});if(!transpose(token,DEFAULT_MUSIC).known)warnings.add(`Acorde desconhecido preservado: [${token}]`);cursor=match.index!+match[0].length;}
  lyric+=raw.slice(cursor);const boundaries=[0,...[...new Intl.Segmenter('pt-BR',{granularity:'grapheme'}).segment(lyric)].map(s=>s.index+s.segment.length)];const valid=new Set(boundaries);for(const a of anchors)if(!valid.has(a.position)){a.position=boundaries.find(p=>p>=a.position)??lyric.length;warnings.add('Acorde ajustado ao limite do caractere Unicode.');}if(/[\[\]]/.test(lyric))warnings.add('Marcação incompleta ou longa preservada literalmente.');return {lyric,anchors};
 });return {lines,warnings:[...warnings]};
}
export function validateChordPage(value:unknown):ChordPage {
 const p=value as ChordPage;if(!p||!Array.isArray(p.lines)||!p.lines.length||p.lines.length>100)throw new Error('Página de cifras inválida.');
 let size=0;const lines=p.lines.map(l=>{if(!l||typeof l.lyric!=='string'||!Array.isArray(l.anchors)||l.anchors.length>100000)throw new Error('Linha de cifras inválida.');let previous=-1;size+=l.lyric.length;const boundaries=new Set([0,...[...new Intl.Segmenter('pt-BR',{granularity:'grapheme'}).segment(l.lyric)].map(s=>s.index+s.segment.length)]);return {lyric:l.lyric,anchors:l.anchors.map(a=>{if(!a||!Number.isSafeInteger(a.position)||a.position<previous||!boundaries.has(a.position)||typeof a.token!=='string'||!a.token.length||a.token.length>80)throw new Error('Posição de acorde inválida.');previous=a.position;size+=a.token.length;return {position:a.position,token:a.token};})};});if(size>100000)throw new Error('Página muito longa.');return {lines};
}
export type ChordUnit={lyric:string;tokens:string[];cells:number};
export function chordUnits(line:ChordLine):ChordUnit[] {
 const byPosition=new Map<number,string[]>();for(const a of line.anchors){const tokens=byPosition.get(a.position)??[];tokens.push(a.token);byPosition.set(a.position,tokens);}
 const segments=[...new Intl.Segmenter('pt-BR',{granularity:'grapheme'}).segment(line.lyric)];const units:ChordUnit[]=[];
 for(const s of [...segments,{segment:'',index:line.lyric.length}]){const tokens=byPosition.get(s.index)??[];if(s.segment||tokens.length)units.push({lyric:s.segment,tokens,cells:Math.max(/[^\u0000-\u024f\u0300-\u036f]/u.test(s.segment)?2:s.segment?1:0,tokens.length?[...tokens.join(' ')].reduce((n,c)=>n+(/[^\u0000-\u024f\u0300-\u036f]/u.test(c)?2:1),0)+1:0)});}return units;
}
export function chordPages(text:string,m:Music,theme:Theme):ChordPage[] {
 const {innerWidth,innerHeight}=slideGeometry(theme);const columns=Math.max(8,Math.floor(innerWidth/(theme.fontSize*(theme.font==='mono'?.72:1))));const limit=Math.max(1,Math.floor(innerHeight/(theme.fontSize*2.6)));
 const pages:ChordPage[]=[];let rows:ChordLine[]=[];const flush=()=>{if(rows.length)pages.push({lines:rows});rows=[];};
 for(const line of parseChords(text).lines){if(!line.lyric.trim()&&!line.anchors.length||line.lyric.trim()==='---'&&!line.anchors.length){flush();continue;}
 const transposed={...line,anchors:line.anchors.map(a=>({...a,token:transpose(a.token,m).token}))};let row:ChordLine={lyric:'',anchors:[]},cells=0;
 const add=()=>{rows.push(row);row={lyric:'',anchors:[]};cells=0;if(rows.length>=limit)flush();};
 for(const unit of chordUnits(transposed)){if(cells&&cells+unit.cells>columns)add();for(const token of unit.tokens)row.anchors.push({position:row.lyric.length,token});row.lyric+=unit.lyric;cells+=unit.cells;}if(row.lyric||row.anchors.length)add();
 }flush();return pages;
}
// Render continuous lyric runs between anchors rather than spacing individual letters.
export function chordRuns(line:ChordLine):ChordUnit[] {
 const runs:ChordUnit[]=[];
 for(const unit of chordUnits(line)){
  if(!unit.tokens.length&&runs.length)runs[runs.length-1].lyric+=unit.lyric;
  else runs.push({...unit,tokens:[...unit.tokens]});
 }
 const cells=(s:string)=>[...new Intl.Segmenter('pt-BR',{granularity:'grapheme'}).segment(s)].reduce((n,g)=>n+(/[^\u0000-\u024f\u0300-\u036f]/u.test(g.segment)?2:1),0);
 return runs.map(r=>({...r,cells:Math.max(cells(r.lyric),r.tokens.length?cells(r.tokens.join(' '))+1:0)}));
}
