import { DatabaseSync } from 'node:sqlite';
import type { SqlDump, SqlTable, BibleMapping, BiblePreview, Verse } from '../shared/bible';
import { bookNumber, validateVerses } from '../shared/bible';
type Token={value:string;kind:'word'|'string'|'number'|'symbol'|'end';line:number};
class Lexer {
 private offset=0;private line=1;
 constructor(private text:string){}
 next():Token {
  const t=this.text;const step=()=>{if(t[this.offset]==='\n')this.line++;return t[this.offset++];};
  while(this.offset<t.length){if(/\s/.test(t[this.offset])){step();continue;}if(t.startsWith('--',this.offset)){while(this.offset<t.length && step()!=='\n'){}continue;}if(t.startsWith('/*',this.offset)){step();step();while(this.offset<t.length && !t.startsWith('*/',this.offset))step();if(this.offset>=t.length)throw new Error(`Linha ${this.line}: comentário não terminado.`);step();step();continue;}break;}
  const line=this.line;if(this.offset>=t.length)return {value:'',kind:'end',line};const first=step();
  if(["'",'"','`'].includes(first)){let value='';while(this.offset<t.length){const char=step();if(char===first){if(t[this.offset]===first){step();value+=char;continue;}return {value,kind:first==="'"?'string':'word',line};}value+=char;if(value.length>20000)throw new Error(`Linha ${line}: literal acima de 20 mil caracteres.`);}throw new Error(`Linha ${line}: aspas não terminadas.`);}
  if(/[a-zA-Z_]/.test(first)){let value=first;while(/[a-zA-Z0-9_$]/.test(t[this.offset]??'') && this.offset<t.length)value+=step();return {value,kind:'word',line};}
  if(/[0-9+-]/.test(first)){let value=first;while(/[0-9]/.test(t[this.offset]??'') && this.offset<t.length)value+=step();if(!/^[+-]?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))throw new Error(`Linha ${line}: inteiro inválido.`);return {value,kind:'number',line};}
  return {value:first,kind:'symbol',line};
 }
}
export function parseSql(text:string):SqlTable[] {
 const lexer=new Lexer(text.replace(/^\uFEFF/,''));let token=lexer.next();let rows=0;const tables=new Map<string,SqlTable>();
 const next=()=>{const previous=token;token=lexer.next();return previous;};const is=(s:string)=>token.value.toUpperCase()===s;const fail=(message:string):never=>{throw new Error(`Linha ${token.line}: ${message} Encontrado: ${token.value||'fim do arquivo'}. Exporte CREATE TABLE simples e INSERT com valores literais.`);};
 const expect=(s:string)=>{if(!is(s))fail(`Esperado ${s}.`);next();};
 const identifier=()=>{if(token.kind!=='word' || !/^[a-zA-Z_][a-zA-Z0-9_$]{0,99}$/.test(token.value))fail('Nome de tabela/coluna não suportado.');return next().value.toLowerCase();};
 const literal=():string|number=>{if(token.kind==='string')return next().value;if(token.kind==='number')return Number(next().value);return fail('Somente strings com aspas simples e números inteiros são aceitos.');};
 while(token.kind!=='end') {
  if(is(';')){next();continue;}
  if(is('BEGIN') || is('COMMIT') || is('END')){next();if(is('TRANSACTION'))next();expect(';');continue;}
  if(is('CREATE')){
   next();expect('TABLE');if(is('IF')){next();expect('NOT');expect('EXISTS');}const name=identifier();if(tables.has(name) || tables.size>=20)fail('Tabela duplicada ou mais de 20 tabelas.');expect('(');const columns:string[]=[];
   while(!is(')')){
    if(is('PRIMARY') || is('UNIQUE')){if(is('PRIMARY')){next();expect('KEY');}else next();expect('(');identifier();while(is(',')){next();identifier();}expect(')');}
    else {const column=identifier();if(columns.includes(column) || columns.length>=32)fail('Coluna duplicada ou mais de 32 colunas.');columns.push(column);if(!['INTEGER','INT','BIGINT','SMALLINT','TEXT','VARCHAR','NVARCHAR','CHAR'].includes(token.value.toUpperCase()))fail('Tipo de coluna não suportado.');next();if(is('(')){next();if(token.kind!=='number')fail('Comprimento de coluna inválido.');next();expect(')');}
     while(!is(',') && !is(')')){if(is('NOT')){next();expect('NULL');}else if(is('PRIMARY')){next();expect('KEY');}else if(is('UNIQUE') || is('AUTOINCREMENT') || is('NULL'))next();else if(is('DEFAULT')){next();if(is('NULL'))next();else literal();}else fail('Restrição de coluna não suportada.');}
    }
    if(!is(','))break;next();if(is(')'))fail('Vírgula sem coluna.');
   }
   expect(')');expect(';');if(!columns.length)fail('Tabela sem colunas.');tables.set(name,{name,columns,rows:[]});continue;
  }
  if(is('INSERT')){
   next();expect('INTO');const name=identifier();const table=tables.get(name);let columns:string[]=[];
   if(is('(')){next();columns.push(identifier());while(is(',')){next();columns.push(identifier());}expect(')');}
   if(columns.length>32)fail('Mais de 32 colunas.');
   if(!table){if(!columns.length)fail('INSERT sem declaração da tabela ou lista de colunas.');if(tables.size>=20)fail('Mais de 20 tabelas.');tables.set(name,{name,columns:[...columns],rows:[]});}
   const target=tables.get(name)!;if(!columns.length)columns=target.columns;
   if(new Set(columns).size!==columns.length || columns.some(c=>!target.columns.includes(c)))fail('Todas as colunas da tabela devem estar presentes no INSERT.');
   expect('VALUES');
   do {if(is(','))next();expect('(');const values:(string|number)[]=[literal()];while(is(',')){next();values.push(literal());}expect(')');if(values.length!==columns.length)fail('Quantidade de valores diferente das colunas.');if(++rows>110000)fail('Mais de 110 mil linhas no arquivo.');target.rows.push(target.columns.map(c=>columns.includes(c)?values[columns.indexOf(c)]:''));}while(is(','));
   expect(';');continue;
  }
  fail('Comando ou expressão SQL não permitido.');
 }
 if(!tables.size || !rows)throw new Error('O arquivo não contém tabelas com versículos.');return [...tables.values()];
}
const names=(t:SqlTable,aliases:string[])=>t.columns.find(c=>aliases.includes(c))??'';
export function suggestMapping(tables:SqlTable[]):BibleMapping {
 const table=tables.find(t=>names(t,['verse','versiculo','verse_number']) && names(t,['text','texto','content']))??tables[0];const books=tables.find(t=>t!==table && names(t,['name','nome','book_name']));
 return {table:table.name,book:names(table,['book','livro','book_id','book_number']),chapter:names(table,['chapter','capitulo','chapter_number']),verse:names(table,['verse','versiculo','verse_number']),text:names(table,['text','texto','content']),booksTable:books?.name??'',bookId:books?names(books,['id','book_id']):'',bookName:books?names(books,['name','nome','book_name']):'',canonicalNumbers:false,overrides:{}};
}
export function mapDump(dump:SqlDump,m:BibleMapping):{rows:Verse[];preview:BiblePreview} {
 const table=dump.tables.find(t=>t.name===m.table);if(!table)throw new Error('Selecione uma tabela de versículos.');const index=(t:SqlTable,c:string)=>{const i=t.columns.indexOf(c);if(i<0)throw new Error(`Coluna não encontrada: ${c}`);return i;};const indexes=[m.book,m.chapter,m.verse,m.text].map(c=>index(table,c));if(new Set(indexes).size!==4)throw new Error('Use quatro colunas diferentes para os versículos.');
 if(table.rows.length>100000)throw new Error('Mais de 100 mil versículos.');
 for(const column of ['version','translation','version_id','bible_id','translation_id']){const i=table.columns.indexOf(column);if(i>=0 && new Set(table.rows.map(row=>row[i])).size>1)throw new Error('Múltiplas traduções detectadas. Exporte uma tradução por arquivo.');}
 const books=new Map<string,string>();if(m.booksTable){const t=dump.tables.find(t=>t.name===m.booksTable);if(!t)throw new Error('Tabela de livros não encontrada.');const id=index(t,m.bookId),name=index(t,m.bookName);for(const row of t.rows){const key=String(row[id]);if(books.has(key))throw new Error(`Identificador de livro duplicado: ${key}`);books.set(key,String(row[name]));}}
 const unresolved=new Set<string>();const errors:string[]=[];const rows:Verse[]=[];const originals=new Set<string>();const keys=new Set<string>();
 for(const row of table.rows){const raw=String(row[indexes[0]]);const label=m.booksTable?books.get(raw):raw;if(label===undefined){if(errors.length<20)errors.push(`Livro ${raw} não consta na tabela de livros.`);continue;}originals.add(label);const override=m.overrides?.[label];const canonical=m.canonicalNumbers && /^\d+$/.test(label)?Number(label):null;const book=override??canonical??bookNumber(label);if(!book || book<1 || book>66){unresolved.add(label);continue;}
  const chapter=Number(row[indexes[1]]),verse=Number(row[indexes[2]]),text=row[indexes[3]];if(!/^\d+$/.test(String(row[indexes[1]])) || !/^\d+$/.test(String(row[indexes[2]])) || typeof text!=='string' || !text.trim() || text.length>20000 || !Number.isInteger(chapter) || chapter<1 || chapter>200 || !Number.isInteger(verse) || verse<1 || verse>300){if(errors.length<20)errors.push(`Registro inválido em ${label} ${chapter}:${verse}.`);continue;}const id=`${book}:${chapter}:${verse}`;if(keys.has(id)){if(errors.length<20)errors.push(`Versículo duplicado: ${label} ${chapter}:${verse}.`);continue;}keys.add(id);rows.push({book,chapter,verse,text});
 }
 rows.sort((a,b)=>a.book-b.book||a.chapter-b.chapter||a.verse-b.verse);const warnings:string[]=[];const chapters=new Map<string,number[]>();for(const v of rows){const id=`${v.book}:${v.chapter}`;if(!chapters.has(id))chapters.set(id,[]);chapters.get(id)!.push(v.verse);}
 const bookChapters=new Map<number,Set<number>>();for(const v of rows){if(!bookChapters.has(v.book))bookChapters.set(v.book,new Set());bookChapters.get(v.book)!.add(v.chapter);}let chapterGaps=0;for(const list of bookChapters.values())if([...list].sort((a,b)=>a-b).some((n,i)=>n!==i+1))chapterGaps++;if(chapterGaps)warnings.push(`${chapterGaps} livro(s) com capítulos ausentes ou numeração inicial diferente de 1.`);
 let gaps=0;for(const list of chapters.values())if(list.some((n,i)=>n!==i+1))gaps++;if(gaps)warnings.push(`${gaps} capítulo(s) com numeração inicial diferente de 1 ou lacunas.`);
 const countBooks=new Set(rows.map(r=>r.book)).size;if(countBooks<66)warnings.push(`${66-countBooks} livro(s) da ordem canônica de 66 livros não estão presentes.`);
 warnings.push('Cobertura não certificada: finais de capítulos e diferenças de versificação devem ser conferidos na fonte. Confirme o uso de conteúdo parcial ou não certificado.');
 return {rows,preview:{count:rows.length,books:countBooks,chapters:chapters.size,warnings,errors,unresolved:[...unresolved].slice(0,100),samples:rows.length?[rows[0],rows[Math.floor(rows.length/2)],rows[rows.length-1]]:[],partial:true,originalNames:[...originals].slice(0,100)}};
}

// Read ordinary tables only; schema SQL, views, triggers and extensions are never executed.
export function readSqlite(path:string):SqlTable[] {
 const db=new DatabaseSync(path,{readOnly:true,allowExtension:false});
 try {
  db.exec('PRAGMA trusted_schema=OFF; PRAGMA query_only=ON');
  const schema=db.prepare("SELECT name,type FROM pragma_table_list WHERE schema='main' AND name NOT LIKE 'sqlite_%'").all();
  const ordinary=schema.filter(t=>t.type==='table');
  if(!ordinary.length || ordinary.length>20)throw new Error('O banco deve conter entre 1 e 20 tabelas comuns. Views e tabelas virtuais não são importadas.');
  const quote=(name:string)=>'"'+name.replaceAll('"','""')+'"';
  const tables:SqlTable[]=[];let count=0;
  for(const entry of ordinary){
   const name=String(entry.name);
   const info=db.prepare('SELECT name,hidden FROM pragma_table_xinfo(?)').all(name);
   if(info.some(c=>c.hidden!==0))throw new Error('Colunas geradas ou ocultas não são suportadas.');
   const columns=info.map(c=>String(c.name));
   if(!columns.length || columns.length>32)throw new Error('Tabela com quantidade de colunas não suportada.');
   const rows:(string|number)[][]=[];
   for(const row of db.prepare(`SELECT ${columns.map(quote).join(',')} FROM ${quote(name)} LIMIT 110001`).iterate()){
    if(++count>110000)throw new Error('Mais de 110 mil linhas no arquivo.');
    rows.push(columns.map(c=>{const value=row[c];if(value===null)return '';if(typeof value==='string' && value.length<=20000)return value;if(typeof value==='number' && Number.isSafeInteger(value))return value;throw new Error('O banco contém valores não suportados (BLOB, real ou texto excessivo).');}));
   }
   tables.push({name,columns,rows});
  }
  if(!count)throw new Error('O banco não contém dados.');
  return tables;
 }finally{db.close();}
}
