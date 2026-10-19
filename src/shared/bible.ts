import { slidesForText } from './slides';
import type { Theme } from './content';
export const BOOK_NAMES=['Gênesis','Êxodo','Levítico','Números','Deuteronômio','Josué','Juízes','Rute','1 Samuel','2 Samuel','1 Reis','2 Reis','1 Crônicas','2 Crônicas','Esdras','Neemias','Ester','Jó','Salmos','Provérbios','Eclesiastes','Cânticos','Isaías','Jeremias','Lamentações','Ezequiel','Daniel','Oseias','Joel','Amós','Obadias','Jonas','Miqueias','Naum','Habacuque','Sofonias','Ageu','Zacarias','Malaquias','Mateus','Marcos','Lucas','João','Atos','Romanos','1 Coríntios','2 Coríntios','Gálatas','Efésios','Filipenses','Colossenses','1 Tessalonicenses','2 Tessalonicenses','1 Timóteo','2 Timóteo','Tito','Filemom','Hebreus','Tiago','1 Pedro','2 Pedro','1 João','2 João','3 João','Judas','Apocalipse'];
const aliases=['Gn Gen Genesis','Ex Exod Exodus','Lv Lev Leviticus','Nm Num Numbers','Dt Deut Deuteronomy','Js Josh Joshua','Jz Judg Judges','Rt Ruth','1Sm 1Sam 1Samuel','2Sm 2Sam 2Samuel','1Rs 1Kgs 1Kings','2Rs 2Kgs 2Kings','1Cr 1Chr 1Chronicles','2Cr 2Chr 2Chronicles','Ed Ezra','Ne Neh Nehemiah','Et Esth Esther','Job','Sl Ps Psalms','Pv Prov Proverbs','Ec Eccl Ecclesiastes','Ct Cant SongofSongs SongofSolomon','Is Isa Isaiah','Jr Jer Jeremiah','Lm Lam Lamentations','Ez Ezek Ezekiel','Dn Dan Daniel','Os Hos Hosea','Jl Joel','Am Amos','Ob Obad Obadiah','Jn Jonah','Mq Mic Micah','Na Nah Nahum','Hc Hab Habakkuk','Sf Zeph Zephaniah','Ag Hag Haggai','Zc Zech Zechariah','Ml Mal Malachi','Mt Matt Matthew','Mc Mk Mark','Lc Lk Luke','Jo Jn John','At Acts','Rm Rom Romans','1Co 1Cor 1Corinthians','2Co 2Cor 2Corinthians','Gl Gal Galatians','Ef Eph Ephesians','Fp Phil Philippians','Cl Col Colossians','1Ts 1Thess 1Thessalonians','2Ts 2Thess 2Thessalonians','1Tm 1Tim 1Timothy','2Tm 2Tim 2Timothy','Tt Titus','Fm Phlm Philemon','Hb Heb Hebrews','Tg Jas James','1Pe 1Pet 1Peter','2Pe 2Pet 2Peter','1Jo 1John','2Jo 2John','3Jo 3John','Jd Jude','Ap Rev Revelation'];
export const fold=(s:string)=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const key=(s:string)=>fold(s).replace(/[^a-z0-9]/g,'');
export function bookNumber(name:string):number|null {
 if(name.trim().toLowerCase().replace(/[.\s]/g,'')==='jó')return 18;
 const value=key(name);if(!value || /^\d+$/.test(value))return null;
 const matches=BOOK_NAMES.flatMap((n,i)=>[...(i===17?[]:[key(n)]),...aliases[i].split(' ').map(key)].includes(value)?[i+1]:[]);
 return matches.length===1?matches[0]:null;
}
export type Verse={book:number;chapter:number;verse:number;text:string};
export type BibleMeta={id:string;name:string;abbreviation:string;language:string;edition:string;origin:string;notes:string;attribution:string;hash:string;partial:boolean;count:number;books:number;createdAt:string};
export type Passage={versionId:string;name:string;abbreviation:string;attribution:string;verses:Verse[]};
export type BibleMapping={table:string;book:string;chapter:string;verse:string;text:string;booksTable:string;bookId:string;bookName:string;canonicalNumbers:boolean;overrides:Record<string,number>};
export type SqlTable={name:string;columns:string[];rows:(string|number)[][]};
export type SqlDump={tables:SqlTable[];hash:string;filename:string};
export type SqlSelection={token:string;filename:string;hash:string;tables:{name:string;columns:string[];count:number}[];mapping:BibleMapping};
export type BiblePreview={count:number;books:number;chapters:number;warnings:string[];errors:string[];unresolved:string[];samples:Verse[];partial:boolean;originalNames:string[]};
export function validateVerses(value:unknown):Verse[] {
 if(!Array.isArray(value) || !value.length || value.length>100000)throw new Error('Quantidade de versículos inválida.');
 const seen=new Set<string>();
 return value.map(v=>{if(!v || !Number.isInteger(v.book) || v.book<1 || v.book>66 || !Number.isInteger(v.chapter) || v.chapter<1 || v.chapter>200 || !Number.isInteger(v.verse) || v.verse<1 || v.verse>300 || typeof v.text!=='string' || !v.text.trim() || v.text.length>20000)throw new Error('Livro, capítulo, versículo ou texto inválido.');const id=`${v.book}:${v.chapter}:${v.verse}`;if(seen.has(id))throw new Error(`Versículo duplicado: ${id}`);seen.add(id);return {book:v.book,chapter:v.chapter,verse:v.verse,text:v.text};});
}
export function validateMeta(v:unknown):BibleMeta {
 if(!v || typeof v!=='object')throw new Error('Cadastro inválido.');const m=v as BibleMeta;
 for(const [field,max,required] of [['name',200,true],['abbreviation',20,true],['language',30,true],['edition',100,false],['origin',500,false],['notes',1000,false],['attribution',60,false]] as const)if(typeof m[field]!=='string' || m[field].length>max || (required && !m[field].trim()))throw new Error(`Campo obrigatório ou inválido: ${field}`);
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(m.id) || !/^[a-f0-9]{64}$/.test(m.hash) || typeof m.partial!=='boolean' || !Number.isInteger(m.count) || m.count<1 || m.count>100000 || !Number.isInteger(m.books) || m.books<1 || m.books>66 || !Number.isFinite(Date.parse(m.createdAt)))throw new Error('Metadados da Bíblia inválidos.');
 return {...m,name:m.name.trim(),abbreviation:m.abbreviation.trim(),language:m.language.trim()};
}
export function validatePassage(v:unknown):Passage {
 if(!v || typeof v!=='object')throw new Error('Passagem inválida.');const p=v as Passage;
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(p.versionId) || typeof p.name!=='string' || p.name.length>200 || typeof p.abbreviation!=='string' || !p.abbreviation.trim() || p.abbreviation.length>20 || typeof p.attribution!=='string' || p.attribution.length>60 || !Array.isArray(p.verses) || p.verses.length>30)throw new Error('Passagem inválida ou acima de 30 versículos.');
 const verses=validateVerses(p.verses);if(verses.some((v,i)=>v.book!==verses[0].book || v.chapter!==verses[0].chapter || (i>0 && v.verse!==verses[i-1].verse+1)))throw new Error('Selecione versículos consecutivos de um mesmo capítulo.');if(verses.reduce((n,v)=>n+v.text.length,0)>90000)throw new Error('Selecione um trecho menor, com até 90 mil caracteres.');
 return {versionId:p.versionId,name:p.name,abbreviation:p.abbreviation,attribution:p.attribution,verses};
}
export function passageText(p:Passage):string {return p.verses.map(v=>`${v.text}\n${BOOK_NAMES[v.book-1]} ${v.chapter}:${v.verse} · ${p.abbreviation}${p.attribution?'\n'+p.attribution:''}`).join('\n\n');}
export function passageSlides(p:Passage,theme:Theme):string[] {return p.verses.flatMap(v=>{const citation=slidesForText(`${BOOK_NAMES[v.book-1]} ${v.chapter}:${v.verse} · ${p.abbreviation}${p.attribution?'\n'+p.attribution:''}`,theme).join('\n');return slidesForText(v.text,theme,Math.min(6,citation.split('\n').length)).map(page=>`${page}\n${citation}`);});}
export function reference(value:string):{book:number;chapter:number;start:number;end:number} {
 const match=/^(.+?)\s*(\d+)\s*:\s*(\d+)(?:\s*-\s*(\d+))?$/.exec(value.trim());const book=match?bookNumber(match[1]):null;
 if(!match || !book)throw new Error('Use uma referência como Jo 3:16 ou 1 Jo 2:1-3.');const chapter=Number(match[2]),start=Number(match[3]),end=Number(match[4]??match[3]);if(chapter<1 || chapter>200 || start<1 || end<start || end-start>=30 || end>300)throw new Error('Referência inválida ou intervalo acima de 30 versículos.');return {book,chapter,start,end};
}
