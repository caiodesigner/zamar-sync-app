export type EntityKind = 'song' | 'text' | 'program' | 'theme' | 'bible-version';
export type LibraryRecord = { id: string; kind: EntityKind; title: string; data: Record<string, unknown>; createdAt: string; updatedAt: string };
export type Asset = { id: string; name: string; mediaType: string; sha256: string; size: number };
export const entityKinds: readonly EntityKind[] = ['song', 'text', 'program', 'theme', 'bible-version'];
export function validateKind(value: unknown): EntityKind {
  if (typeof value !== 'string' || !entityKinds.includes(value as EntityKind)) throw new Error('Tipo de conteúdo inválido.');
  return value as EntityKind;
}
function validateJson(value: unknown, depth = 0): void {
  if (depth > 32) throw new Error('Registro excede a profundidade permitida.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (Array.isArray(value) && value.length <= 10000) { for (const item of value) validateJson(item, depth + 1); return; }
  if (value && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    const entries = Object.entries(value); if (entries.length > 10000) throw new Error('Registro excessivamente grande.');
    for (const [, item] of entries) validateJson(item, depth + 1); return;
  }
  throw new Error('O registro deve conter somente dados JSON válidos.');
}
export function validateRecord(value: unknown): LibraryRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Registro inválido.');
  const record = value as LibraryRecord;
  validateKind(record.kind);
  validateJson(record.data);
  if (typeof record.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(record.id) || typeof record.title !== 'string' || !record.title.trim() || record.title.length > 200 || !record.data || typeof record.data !== 'object' || Array.isArray(record.data) || JSON.stringify(record.data).length > 1_000_000 || typeof record.createdAt !== 'string' || !Number.isFinite(Date.parse(record.createdAt)) || typeof record.updatedAt !== 'string' || !Number.isFinite(Date.parse(record.updatedAt))) throw new Error('Campos do registro inválidos.');
  return { id: record.id, kind: record.kind, title: record.title.trim(), data: record.data, createdAt: record.createdAt, updatedAt: record.updatedAt };
}
