import { DatabaseSync } from 'node:sqlite';
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { acquireStoreLock } from './lock';
import { type Asset, type EntityKind, type LibraryRecord, validateKind, validateRecord } from '../shared/models';
const VERSION = 2;
const MAX_BYTES = 128 * 1024 * 1024;
const hash = (data: Buffer) => createHash('sha256').update(data).digest('hex');
const digestPattern = /^[a-f0-9]{64}$/;
function atomicWrite(path: string, data: Buffer) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const fd = openSync(temporary, 'wx', 0o600);
    try { writeFileSync(fd, data); fsyncSync(fd); } finally { closeSync(fd); }
    renameSync(temporary, path);
  }
  finally { rmSync(temporary, { force: true }); }
}
export class Store {
  private db!: DatabaseSync;
  private unlock: () => void;
  private closed = false;
  constructor(readonly directory: string) {
    this.unlock = acquireStoreLock(directory);
    try {
      const path = join(directory, 'zamar.sqlite');
      this.db = new DatabaseSync(path, { timeout: 2000 });
      this.db.exec('PRAGMA trusted_schema=OFF; PRAGMA foreign_keys=ON;');
      const version = Number(this.db.prepare('PRAGMA user_version').get()!.user_version);
      if (version > VERSION) throw new Error('Banco de uma versão futura. Abra com uma versão mais recente do Zamar Sync.');
      this.db.exec('PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA locking_mode=EXCLUSIVE; BEGIN EXCLUSIVE; COMMIT;');
      if (version === 0) {
        if (this.db.prepare("SELECT name FROM sqlite_schema WHERE type='table'").all().length) {
          mkdirSync(join(directory, 'backups'), { recursive: true });
          this.snapshot(join(directory, 'backups', `migration-${Date.now()}-${randomUUID()}.sqlite`));
        }
        this.transaction(() => {
          this.db.exec("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE records (kind TEXT NOT NULL CHECK(kind IN ('song','text','program','theme','bible-version')), id TEXT NOT NULL, title TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(kind,id)); CREATE INDEX records_title ON records(kind,title COLLATE NOCASE); CREATE TABLE assets (id TEXT PRIMARY KEY, name TEXT NOT NULL, media_type TEXT NOT NULL, sha256 TEXT NOT NULL, size INTEGER NOT NULL CHECK(size >= 0)); PRAGMA user_version=2;");
        });
      }
      if (version === 1) {
        this.checkDatabase(this.db, true);
        mkdirSync(join(directory, 'backups'), { recursive: true });
        this.snapshot(join(directory, 'backups', `migration-${Date.now()}-${randomUUID()}.sqlite`));
        this.transaction(() => this.db.exec("ALTER TABLE records RENAME TO records_v1; DROP INDEX records_title; CREATE TABLE records (kind TEXT NOT NULL CHECK(kind IN ('song','text','program','theme','bible-version')), id TEXT NOT NULL, title TEXT NOT NULL, payload TEXT NOT NULL CHECK(json_valid(payload)), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(kind,id)); INSERT INTO records SELECT * FROM records_v1; DROP TABLE records_v1; CREATE INDEX records_title ON records(kind,title COLLATE NOCASE); PRAGMA user_version=2;"));
      }
      this.checkDatabase(this.db);
      mkdirSync(join(directory, 'assets'), { recursive: true });
    } catch (error) { try { this.db?.close(); } finally { this.unlock(); } throw error; }
  }
  private transaction(action: () => void) {
    this.db.exec('BEGIN IMMEDIATE');
    try { action(); this.db.exec('COMMIT'); } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  private checkDatabase(db: DatabaseSync, legacy = false) {
    if (!(legacy ? [1,VERSION] : [VERSION]).includes(Number(db.prepare('PRAGMA user_version').get()!.user_version)) || db.prepare('PRAGMA integrity_check').get()!.integrity_check !== 'ok') throw new Error('Banco incompatível ou corrompido. Nenhum dado foi substituído.');
    const schema = db.prepare("SELECT type,name,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").all();
    const expected = new Set(['settings', 'records', 'assets', 'records_title']);
    if (schema.length !== expected.size || schema.some(row => !expected.has(String(row.name)) || !['table','index'].includes(String(row.type)) || /VIRTUAL/i.test(String(row.sql)))) throw new Error('Estrutura de banco não reconhecida.');
    // Only known tables and columns are read. Imported SQL is never executed.
    db.prepare('SELECT key,value FROM settings').all();
    db.prepare('SELECT kind,id,title,payload,created_at,updated_at FROM records').all();
    db.prepare('SELECT id,name,media_type,sha256,size FROM assets').all();
  }
  private snapshot(path: string) { this.db.prepare('VACUUM INTO ?').run(path); }
  getSetting(key: string): string | undefined { return (this.db.prepare('SELECT value FROM settings WHERE key=?').get(key) as { value: string } | undefined)?.value; }
  setSetting(key: string, value: string): void {
    if (typeof key !== 'string' || key.length > 100 || typeof value !== 'string' || value.length > 1_000_000) throw new Error('Configuração inválida.');
    this.db.prepare('INSERT INTO settings(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, value);
  }
  read(): string { return this.getSetting('draft') ?? 'Vamos juntos cantar\nUma nova canção'; }
  save(text: string): void { this.setSetting('draft', validateText(text)); }
  list(kind: EntityKind): LibraryRecord[] {
    validateKind(kind);
    return this.db.prepare('SELECT * FROM records WHERE kind=? ORDER BY title COLLATE NOCASE,id').all(kind).map(row => this.record(row));
  }
  private record(row: Record<string, unknown>): LibraryRecord { return validateRecord({ kind: row.kind, id: row.id, title: row.title, data: JSON.parse(String(row.payload)), createdAt: row.created_at, updatedAt: row.updated_at }); }
  put(value: unknown): LibraryRecord {
    const record = validateRecord(value);
    this.db.prepare('INSERT INTO records(kind,id,title,payload,created_at,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET title=excluded.title,payload=excluded.payload,updated_at=excluded.updated_at').run(record.kind, record.id, record.title, JSON.stringify(record.data), record.createdAt, record.updatedAt);
    return this.record(this.db.prepare('SELECT * FROM records WHERE kind=? AND id=?').get(record.kind, record.id)!);
  }
  addAsset(name: string, mediaType: string, bytes: Buffer): Asset {
    if (typeof name !== 'string' || !name.trim() || name.length > 200 || typeof mediaType !== 'string' || !mediaType.trim() || mediaType.length > 100 || !Buffer.isBuffer(bytes) || bytes.length > (mediaType==='application/vnd.zamar.bible+gzip'?64:10) * 1024 * 1024) throw new Error('Anexo inválido ou acima do limite de tamanho.');
    const asset: Asset = { id: randomUUID(), name, mediaType, sha256: hash(bytes), size: bytes.length };
    const path = join(this.directory, 'assets', asset.sha256);
    if (!existsSync(path)) atomicWrite(path, bytes);
    else if (hash(readFileSync(path)) !== asset.sha256) throw new Error('Anexo local corrompido.');
    this.db.prepare('INSERT INTO assets VALUES (?,?,?,?,?)').run(asset.id, asset.name, asset.mediaType, asset.sha256, asset.size);
    return asset;
  }
  imageBytes(digest: string): Buffer {
    if (typeof digest !== 'string' || !digestPattern.test(digest)) throw new Error('Imagem inválida.');
    const asset = this.assets().find(a => a.sha256 === digest && a.mediaType === 'image/png');
    if (!asset || asset.size > 10 * 1024 * 1024) throw new Error('Imagem não encontrada.');
    const path = join(this.directory, 'assets', digest);
    if (statSync(path).size !== asset.size) throw new Error('Imagem corrompida.');
    const bytes = readFileSync(path);
    if (bytes.length !== asset.size || hash(bytes) !== digest) throw new Error('Imagem corrompida.');
    return bytes;
  }
  assetBytes(digest: string): Buffer {
    if (!digestPattern.test(digest)) throw new Error('Anexo inválido.');
    const asset=this.assets().find(a=>a.sha256===digest);if(!asset || asset.size>(asset.mediaType==='application/vnd.zamar.bible+gzip'?64:10)*1024*1024)throw new Error('Anexo indisponível.');
    const path=join(this.directory,'assets',digest);if(statSync(path).size!==asset.size)throw new Error('Anexo corrompido.');const bytes=readFileSync(path);if(hash(bytes)!==digest)throw new Error('Anexo corrompido.');return bytes;
  }
  pruneUnregisteredAsset(digest:string):void {if(digestPattern.test(digest) && !this.assets().some(a=>a.sha256===digest))rmSync(join(this.directory,'assets',digest),{force:true});}
  atomic(action:()=>void):void {this.transaction(action);}
  remove(kind:EntityKind,id:string):void {validateKind(kind);this.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run(kind,id);}
  private assets(db = this.db): Asset[] { return db.prepare('SELECT * FROM assets').all().map(row => ({ id: String(row.id), name: String(row.name), mediaType: String(row.media_type), sha256: String(row.sha256), size: Number(row.size) })); }
  createBackup(destination: string): void {
    if (typeof destination !== 'string' || !destination.endsWith('.zamar-backup')) throw new Error('Escolha um arquivo com extensão .zamar-backup.');
    const snapshot = join(this.directory, `.snapshot-${randomUUID()}.sqlite`);
    try {
      this.snapshot(snapshot);
      const database = readFileSync(snapshot);
      let total = database.length;
      const files = [...new Set(this.assets().map(asset => asset.sha256))].map(sha256 => {
        if (!digestPattern.test(sha256)) throw new Error('Identificador de anexo inválido.');
        const bytes = readFileSync(join(this.directory, 'assets', sha256));
        if (hash(bytes) !== sha256) throw new Error('Anexo ausente ou corrompido; backup não concluído.');
        total += bytes.length; if (total > MAX_BYTES) throw new Error('Backup excede o limite básico de 128 MiB de conteúdo.');
        return { sha256, data: bytes.toString('base64') };
      });
      if (total > MAX_BYTES) throw new Error('Backup excede 128 MiB.');
      const envelope = { format: 'zamar-backup', version: 2, schemaVersion: VERSION, createdAt: new Date().toISOString(), database: { sha256: hash(database), data: database.toString('base64') }, files };
      atomicWrite(destination, gzipSync(Buffer.from(JSON.stringify(envelope))));
    } finally { rmSync(snapshot, { force: true }); }
  }
  restoreBackup(source: string): string {
    if (statSync(source).size > MAX_BYTES * 2) throw new Error('Arquivo de backup acima do limite.');
    let value;
    try { value = JSON.parse(gunzipSync(readFileSync(source), { maxOutputLength: MAX_BYTES * 2 }).toString('utf8')); }
    catch { throw new Error('Backup inválido, corrompido ou sem permissão de leitura. Nenhum dado foi substituído.'); }
    if (value?.format !== 'zamar-backup' || ![1,2].includes(value.version) || ![1,VERSION].includes(value.schemaVersion) || !Array.isArray(value.files) || value.files.length > 10000) throw new Error('Formato ou versão de backup incompatível.');
    const decode = (entry: unknown) => {
      if (!entry || typeof entry !== 'object') throw new Error('Entrada de backup inválida.');
      const item = entry as { sha256: string; data: string };
      if (!digestPattern.test(item.sha256) || typeof item.data !== 'string') throw new Error('Entrada de backup inválida.');
      const bytes = Buffer.from(item.data, 'base64');
      if (bytes.toString('base64') !== item.data || hash(bytes) !== item.sha256) throw new Error('Integridade do backup inválida.');
      return bytes;
    };
    const database = decode(value.database);
    let total = database.length;
    const files = new Map<string, Buffer>();
    for (const entry of value.files) {
      const bytes = decode(entry); total += bytes.length;
      if (total > MAX_BYTES || bytes.length > 64 * 1024 * 1024 || files.has(entry.sha256)) throw new Error('Anexos duplicados ou acima do limite.');
      files.set(entry.sha256, bytes);
    }
    if (total > MAX_BYTES) throw new Error('Backup acima do limite.');
    const staging = join(this.directory, `.restore-${randomUUID()}.sqlite`);
    let imported: DatabaseSync | undefined;
    try {
      writeFileSync(staging, database, { flag: 'wx', mode: 0o600 });
      imported = new DatabaseSync(staging, { readOnly: true, allowExtension: false });
      imported.exec('PRAGMA trusted_schema=OFF');
      this.checkDatabase(imported, true);
      if (Number(imported.prepare('PRAGMA user_version').get()!.user_version) !== value.schemaVersion) throw new Error('Versão do manifesto não confere com o banco.');
      const records = imported.prepare('SELECT * FROM records').all().map(row => this.record(row));
      const settings = imported.prepare('SELECT key,value FROM settings').all();
      for (const row of settings) { if (typeof row.key !== 'string' || row.key.length > 100 || typeof row.value !== 'string' || row.value.length > 1_000_000) throw new Error('Configuração de backup inválida.'); }
      for (const row of settings) if (row.key === 'draft') validateText(row.value);
      const assets = this.assets(imported);
      if (new Set(assets.map(a => a.sha256)).size !== files.size) throw new Error('Manifesto de anexos inconsistente.');
      for (const asset of assets) if (asset.size>(asset.mediaType==='application/vnd.zamar.bible+gzip'?64:10)*1024*1024 || !files.has(asset.sha256) || files.get(asset.sha256)!.length !== asset.size || !/^[a-zA-Z0-9_-]{1,100}$/.test(asset.id) || !asset.name.trim() || asset.name.length > 200 || !asset.mediaType.trim() || asset.mediaType.length > 100) throw new Error('Anexo do backup inválido.');
      const backups = join(this.directory, 'backups'); mkdirSync(backups, { recursive: true });
      const previous = join(backups, `auto-${Date.now()}-${randomUUID()}.zamar-backup`);
      this.createBackup(previous);
      // Content-addressed attachments are added first; existing attachments are
      // never removed. A failed DB transaction leaves the previous state intact.
      for (const [digest, bytes] of files) {
        const path = join(this.directory, 'assets', digest);
        if (!existsSync(path) || hash(readFileSync(path)) !== digest) atomicWrite(path, bytes);
      }
      this.transaction(() => {
        this.db.exec('DELETE FROM records; DELETE FROM assets; DELETE FROM settings;');
        for (const row of settings) this.setSetting(String(row.key), String(row.value));
        for (const record of records) this.put(record);
        for (const asset of assets) this.db.prepare('INSERT INTO assets VALUES (?,?,?,?,?)').run(asset.id, asset.name, asset.mediaType, asset.sha256, asset.size);
      });
      const automatic = readdirSync(backups).filter(name => /^auto-\d+-[a-f0-9-]+\.zamar-backup$/.test(name)).sort().reverse();
      for (const old of automatic.slice(5)) { try { rmSync(join(backups, old)); } catch { /* retention must not invalidate a successful restore */ } }
      return previous;
    } finally { imported?.close(); rmSync(staging, { force: true }); }
  }
  close(): void { if (this.closed) return; this.db.close(); this.closed = true; this.unlock(); }
}
export function validateText(value: unknown): string {
  if (typeof value !== 'string' || value.length > 100_000) throw new Error('Texto inválido ou acima de 100 mil caracteres.');
  return value;
}
