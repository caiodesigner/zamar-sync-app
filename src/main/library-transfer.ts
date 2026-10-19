import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { Store } from './storage';
import { contentRecord, readContent, type ContentKind, type Theme, type Program } from '../shared/content';
import { readSong, songRecord } from '../shared/songs';
import { duplicateReason, fileDraft, importedContent, validateImport, type Duplicate, type ImportChoice } from '../shared/transfer';
import { validateAutoEntries, type AutoEntry, type SaveReceipt } from '../shared/autosave';
export class LibraryTransfer {
 private epoch=randomUUID();
 constructor(private store:Store){}
 reset():void {this.epoch=randomUUID();}
 recovery():{epoch:string;receipt:SaveReceipt|null} {
  let receipt:SaveReceipt|null=null;try {const v=JSON.parse(this.store.getSetting('last-autosave')??'null');if(v&&typeof v.at==='string'&&Number.isFinite(Date.parse(v.at))){const entries=validateAutoEntries(v.entries).flatMap(e=>{const current=this.canonical(e);return current===null?[]:[{...e,value:JSON.parse(current),base:current}];});if(entries.length)receipt={at:v.at,entries};}}catch{/* Preserve unsupported checkpoints in backups. */}
  return {epoch:this.epoch,receipt};
 }
 select(path:string){if(!['.txt','.pro','.chordpro'].includes(extname(path).toLowerCase()))throw new Error('Escolha .txt, .pro ou .chordpro UTF-8.');if(statSync(path).size>1024*1024)throw new Error('Arquivo acima de 1 MiB.');const bytes=readFileSync(path);if(bytes.length>1024*1024)throw new Error('Arquivo acima de 1 MiB.');let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new Error('Converta o arquivo para UTF-8 antes de importar.');}return fileDraft(basename(path),text);}
 preview(value:unknown):Duplicate[] {
  const draft=validateImport(value);const result:Duplicate[]=[];for(const record of this.store.list(draft.kind)){
   try{const content=draft.kind==='song'?readSong(record):readContent('text',record) as import('../shared/content').TextContent;const reason=duplicateReason(draft,content);if(reason)result.push({id:record.id,title:record.title,updatedAt:record.updatedAt,subtitle:('author' in content?content.author:'Texto livre')||'Sem autor',revision:createHash('sha256').update(JSON.stringify(record)).digest('hex'),reason});}catch{/* Legacy records are retained, never overwritten by this importer. */}
  }return result;
 }
 confirm(value:unknown,choice:ImportChoice,target:Duplicate|null){
  const d=validateImport(value);if(!['new','ignore','copy','update'].includes(choice))throw new Error('Escolha como tratar a importação.');const duplicates=this.preview(d);
  if(choice==='ignore')return null;if(choice==='new'&&duplicates.length)throw new Error('Há duplicatas. Escolha ignorar, criar cópia ou atualizar.');
  let existing;if(choice==='update'){
   const candidate=duplicates.find(c=>c.id===target?.id);if(!candidate||candidate.updatedAt!==target?.updatedAt||candidate.revision!==target?.revision)throw new Error('O conteúdo mudou desde a prévia. Confira as duplicatas novamente.');existing=this.store.list(d.kind).find(r=>r.id===candidate.id)!;
   mkdirSync(join(this.store.directory,'backups'),{recursive:true});this.store.createBackup(join(this.store.directory,'backups',`import-${Date.now()}-${randomUUID()}.zamar-backup`));
  }
  const draft=choice==='copy'?{...d,title:d.title.slice(0,190)+' (cópia)'}:d;
  const content=importedContent(draft,existing?.id??randomUUID());if(existing&&d.kind==='song'&&'archived' in content)content.archived=readSong(existing).archived;const record=d.kind==='song'?songRecord(content,existing):contentRecord('text',content,existing);
  this.store.atomic(()=>this.store.put(record));return {kind:d.kind,value:d.kind==='song'?readSong(record):readContent('text',record)};
 }
 private canonical(e:AutoEntry):string|null {
  if(e.kind==='draft')return JSON.stringify(this.store.read());const id=typeof e.value==='object'?e.value.id:'';const record=this.store.list(e.kind).find(r=>r.id===id);if(!record)return null;return JSON.stringify(e.kind==='song'?readSong(record):readContent(e.kind as ContentKind,record));
 }
 autosave(epoch:unknown,value:unknown):SaveReceipt {
  if(epoch!==this.epoch)throw new Error('Os dados mudaram. Reabra o conteúdo antes de salvar automaticamente.');const entries=validateAutoEntries(value);
  const records=entries.map(e=>{
   if(this.canonical(e)!==e.base)throw new Error('Conflito de edição: o conteúdo salvo mudou. Reabra a versão da biblioteca ou salve explicitamente para substituir.');
   if(e.kind==='draft')return null;const record=e.kind==='song'?songRecord(e.value):contentRecord(e.kind,e.value);
   const images=e.kind==='theme'?[(e.value as Theme).image]:e.kind==='program'?(e.value as Program).items.map(i=>i.theme.image):[];for(const image of images)if(image)this.store.imageBytes(image);return record;
  });
  const receipt={at:new Date().toISOString(),entries};const serialized=JSON.stringify(receipt);if(serialized.length>1000000)throw new Error('Lote automático acima do limite. Salve os conteúdos individualmente.');
  this.store.atomic(()=>{entries.forEach((e,i)=>{if(e.kind==='draft')this.store.save(e.value as string);else {this.store.put(records[i]!);if(e.kind==='program')this.store.setSetting('last-program',(e.value as Program).id);}});this.store.setSetting('last-autosave',serialized);});return receipt;
 }
}
