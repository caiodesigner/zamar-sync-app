import { parentPort, workerData } from 'node:worker_threads';
import { openSync,readSync,closeSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename,join } from 'node:path';
import { parseSql,mapDump,readSqlite } from './bible-parser';
try {
 if(workerData.action==='parse'){
  const fd=openSync(workerData.path,'r');const chunks:Buffer[]=[];let total=0;
  try{while(true){const chunk=Buffer.alloc(65536);const size=readSync(fd,chunk);if(!size)break;total+=size;if(total>50*1024*1024)throw new Error('Arquivo acima de 50 MiB.');chunks.push(chunk.subarray(0,size));}}finally{closeSync(fd);}
  const bytes=Buffer.concat(chunks);const sqlite=bytes.subarray(0,16).equals(Buffer.from('SQLite format 3\0'));let tables;if(sqlite){const snapshot=join(workerData.temporary,'source.sqlite');writeFileSync(snapshot,bytes);tables=readSqlite(snapshot);}else{let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new Error('O arquivo deve estar em UTF-8. Exporte novamente sem escapes específicos de outro banco.');}
  tables=parseSql(text);}
  parentPort!.postMessage({ok:true,result:{tables,hash:createHash('sha256').update(bytes).digest('hex'),filename:basename(workerData.path)}});
 }else parentPort!.postMessage({ok:true,result:mapDump(workerData.dump,workerData.mapping)});
}catch(error){parentPort!.postMessage({ok:false,error:String(error)});}
