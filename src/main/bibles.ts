import { DatabaseSync } from 'node:sqlite';
import { Worker } from 'node:worker_threads';
import { mkdirSync,existsSync,renameSync,rmSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync,gunzipSync } from 'node:zlib';
import { randomUUID,createHash } from 'node:crypto';
import { Store } from './storage';
import { validateMeta,validatePassage,validateVerses,reference,fold, type BibleMeta,type SqlDump,type BibleMapping,type BiblePreview,type SqlSelection,type Verse,type Passage } from '../shared/bible';
import { suggestMapping } from './bible-parser';
export class Bibles {
 private prepared=new Set<string>();
 private stage:{token:string;dump:SqlDump;rows?:Verse[];preview?:BiblePreview}|null=null;
 private worker:Worker|null=null;private reject:((e:Error)=>void)|null=null;private generation=0;
 constructor(private store:Store){}
 cancel(){this.generation++;this.stage=null;this.worker?.terminate();this.worker=null;this.reject?.(new Error('Importação cancelada.'));this.reject=null;}
 private run<T>(data:unknown):Promise<T>{
  if(this.worker)throw new Error('Aguarde ou cancele a leitura atual.');
  return new Promise((resolve,reject)=>{const worker=new Worker(join(__dirname,'bible-worker.js').replace(/([\\/])app\.asar([\\/])/,'$1app.asar.unpacked$2'),{workerData:data,resourceLimits:{maxOldGenerationSizeMb:384,stackSizeMb:4}});this.worker=worker;this.reject=reject;const timer=setTimeout(()=>finish(new Error('Tempo limite de 30 segundos excedido. Exporte um arquivo menor.')),30000);
   const finish=(error:Error|null,result?:T)=>{clearTimeout(timer);if(this.worker===worker){this.worker=null;this.reject=null;}worker.removeAllListeners();worker.terminate();if(error)reject(error);else resolve(result!);};
   worker.once('message',m=>finish(m.ok?null:new Error(m.error),m.result));worker.once('error',error=>finish(error instanceof Error?error:new Error(String(error))));worker.once('exit',()=>finish(new Error('Leitura interrompida sem conclusão.')));
  });
 }
 async select(path:string):Promise<SqlSelection>{this.cancel();const generation=this.generation;const dump=await this.run<SqlDump>({action:'parse',path});if(generation!==this.generation)throw new Error('Importação cancelada.');const token=randomUUID();this.stage={token,dump};return {token,filename:dump.filename,hash:dump.hash,tables:dump.tables.map(t=>({name:t.name,columns:t.columns,count:t.rows.length})),mapping:suggestMapping(dump.tables)};}
 async preview(token:string,mapping:BibleMapping):Promise<BiblePreview>{const stage=this.require(token);stage.rows=undefined;stage.preview=undefined;const generation=this.generation;const result=await this.run<{rows:Verse[];preview:BiblePreview}>({action:'map',dump:stage.dump,mapping});if(generation!==this.generation)throw new Error('Importação cancelada.');stage.rows=result.rows;stage.preview=result.preview;return result.preview;}
 private require(token:string){if(!this.stage || token!==this.stage.token)throw new Error('Selecione e confira novamente o arquivo.');return this.stage;}
 catalog():{versions:BibleMeta[];defaultId:string|null;skipped:number}{const versions:BibleMeta[]=[];let skipped=0;for(const record of this.store.list('bible-version')){try{versions.push(validateMeta(record.data));}catch{skipped++;}}return {versions,defaultId:this.store.getSetting('default-bible')??null,skipped};}
 import(token:string,fields:Record<string,unknown>,mode:'new'|'copy'|'replace',replaceId:string|null,confirmed:boolean):BibleMeta {
  const stage=this.require(token);if(!confirmed || !stage.rows?.length || !stage.preview || stage.preview.errors.length || stage.preview.unresolved.length)throw new Error('Confira a prévia, resolva os erros e confirme a cobertura antes de importar.');
  if(!['new','copy','replace'].includes(mode))throw new Error('Modo de importação inválido.');const existing=this.catalog().versions;const previous=existing.find(b=>b.id===replaceId);
  if(mode==='replace' && !previous)throw new Error('Selecione a tradução a substituir.');
  if(mode==='new' && existing.some(b=>b.hash===stage.dump.hash || fold(b.abbreviation)===fold(String(fields.abbreviation??''))))throw new Error('Arquivo ou abreviação já cadastrados. Escolha cópia identificada ou substituição.');
  const now=new Date().toISOString();const meta=validateMeta({...fields,id:mode==='replace'?previous!.id:randomUUID(),hash:stage.dump.hash,partial:true,count:stage.rows.length,books:stage.preview.books,createdAt:mode==='replace'?previous!.createdAt:now});
  if(mode==='copy' && existing.some(b=>fold(b.name)===fold(meta.name)))meta.name=(meta.name.slice(0,190)+' (cópia)');
  const serialized=Buffer.from(JSON.stringify(validateVerses(stage.rows)));if(serialized.length>100*1024*1024)throw new Error('Conteúdo normalizado acima de 100 MiB.');const bytes=gzipSync(serialized);if(bytes.length>64*1024*1024)throw new Error('Conteúdo normalizado acima de 64 MiB compactados.');
  if(mode==='replace'){const folder=join(this.store.directory,'backups');mkdirSync(folder,{recursive:true});this.store.createBackup(join(folder,`before-bible-${Date.now()}-${randomUUID()}.zamar-backup`));}
  const digest=createHash('sha256').update(bytes).digest('hex');
  try{this.store.atomic(()=>{const asset=this.store.addAsset('bible-verses.json.gz','application/vnd.zamar.bible+gzip',bytes);this.store.put({id:meta.id,kind:'bible-version',title:meta.name,data:{...meta,corpus:asset.sha256,originalNames:stage.preview!.originalNames},createdAt:meta.createdAt,updatedAt:now});if(!this.store.getSetting('default-bible'))this.store.setSetting('default-bible',meta.id);});}catch(error){this.store.pruneUnregisteredAsset(digest);throw error;}
  this.cancel();return meta;
 }
 setDefault(id:string){if(!this.catalog().versions.some(b=>b.id===id))throw new Error('Bíblia não encontrada.');this.store.setSetting('default-bible',id);}
 remove(id:string){if(!this.catalog().versions.some(b=>b.id===id))throw new Error('Bíblia não encontrada.');const folder=join(this.store.directory,'backups');mkdirSync(folder,{recursive:true});this.store.createBackup(join(folder,`before-bible-delete-${Date.now()}-${randomUUID()}.zamar-backup`));this.store.atomic(()=>{this.store.remove('bible-version',id);if(this.store.getSetting('default-bible')===id)this.store.setSetting('default-bible',this.catalog().versions[0]?.id??'');});}
 private open(id:string):{db:DatabaseSync;meta:BibleMeta}{
  const record=this.store.list('bible-version').find(b=>b.id===id);if(!record)throw new Error('Bíblia não encontrada.');const meta=validateMeta(record.data);const digest=record.data.corpus;if(typeof digest!=='string' || !/^[a-f0-9]{64}$/.test(digest))throw new Error('Conteúdo bíblico inválido.');
  // Verify the immutable source on every open; cached databases are disposable.
  const bytes=this.store.assetBytes(digest);const folder=join(this.store.directory,'bibles');mkdirSync(folder,{recursive:true});const path=join(folder,`${digest}.sqlite`);
  if(!this.prepared.has(digest))rmSync(path,{force:true});
  if(!existsSync(path)){const rows=validateVerses(JSON.parse(gunzipSync(bytes,{maxOutputLength:100*1024*1024}).toString('utf8')));if(rows.length!==meta.count)throw new Error('Quantidade de versículos não confere.');const temp=path+'.'+randomUUID()+'.tmp';let db:DatabaseSync|null=null;
   try{db=new DatabaseSync(temp);db.exec('CREATE TABLE verses(book INTEGER,chapter INTEGER,verse INTEGER,text TEXT,search TEXT,PRIMARY KEY(book,chapter,verse));BEGIN');const insert=db.prepare('INSERT INTO verses VALUES (?,?,?,?,?)');for(const v of rows)insert.run(v.book,v.chapter,v.verse,v.text,fold(v.text));db.exec('COMMIT');db.close();db=null;renameSync(temp,path);}finally{db?.close();rmSync(temp,{force:true});}
  }
  this.prepared.add(digest);
  const db=new DatabaseSync(path,{readOnly:true,allowExtension:false});db.exec('PRAGMA trusted_schema=OFF');return {db,meta};
 }
 query(id:string,request:{reference?:string;search?:string;book?:number;chapter?:number}):{verses:Verse[];truncated:boolean;chapters:number[];books:number[]} {
  const {db}=this.open(id);try{const books=db.prepare('SELECT DISTINCT book FROM verses ORDER BY book').all().map(r=>Number(r.book));let verses:Verse[]=[];let chapters:number[]=[];
   if(request.reference){if(typeof request.reference!=='string' || request.reference.length>100)throw new Error('Referência inválida.');const ref=reference(request.reference);verses=db.prepare('SELECT book,chapter,verse,text FROM verses WHERE book=? AND chapter=? AND verse BETWEEN ? AND ? ORDER BY verse').all(ref.book,ref.chapter,ref.start,ref.end) as Verse[];if(verses.length!==ref.end-ref.start+1)throw new Error('Referência ausente ou incompleta nesta tradução.');}
   else if(request.search!==undefined){if(typeof request.search!=='string' || request.search.trim().length<2 || request.search.length>200)throw new Error('Digite entre 2 e 200 caracteres.');verses=db.prepare('SELECT book,chapter,verse,text FROM verses WHERE instr(search,?)>0 ORDER BY book,chapter,verse LIMIT 201').all(fold(request.search.trim())) as Verse[];}
   else if(request.book!==undefined){if(!Number.isInteger(request.book) || request.book<1 || request.book>66)throw new Error('Livro inválido.');chapters=db.prepare('SELECT DISTINCT chapter FROM verses WHERE book=? ORDER BY chapter').all(request.book).map(r=>Number(r.chapter));if(request.chapter!==undefined){if(!Number.isInteger(request.chapter) || request.chapter<1 || request.chapter>200)throw new Error('Capítulo inválido.');verses=db.prepare('SELECT book,chapter,verse,text FROM verses WHERE book=? AND chapter=? ORDER BY verse LIMIT 301').all(request.book,request.chapter) as Verse[];}}
   return {verses:verses.slice(0,200),truncated:verses.length>200,chapters,books};
  }finally{db.close();}
 }
 passage(id:string,ref:string):Passage {const meta=this.catalog().versions.find(b=>b.id===id);if(!meta)throw new Error('Bíblia não encontrada.');return validatePassage({versionId:id,name:meta.name,abbreviation:meta.abbreviation,attribution:meta.attribution,verses:this.query(id,{reference:ref}).verses});}
}
