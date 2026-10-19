import { validateMusic, parseChords, type Music } from './chords';
import { validateRecord, type LibraryRecord } from './models';
export type Section = { id: string; label: string; text: string };
export type Song = { id: string; title: string; author: string; archived: boolean; sections: Section[]; sequence: string[]; music?:Music };
export function validateSong(value: unknown): Song {
  if (!value || typeof value !== 'object') throw new Error('Música inválida.');
  const s = value as Song;
  if (typeof s.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(s.id) || typeof s.title !== 'string' || !s.title.trim() || s.title.length > 200 || typeof s.author !== 'string' || s.author.length > 200 || typeof s.archived !== 'boolean') throw new Error('Informe título e autor válidos.');
  if (!Array.isArray(s.sections) || !s.sections.length || s.sections.length > 100 || !Array.isArray(s.sequence) || !s.sequence.length || s.sequence.length > 300) throw new Error('Inclua seções e uma sequência de até 300 entradas.');
  const ids = new Set<string>(); let total = 0;
  for (const section of s.sections) {
    if (!section || typeof section.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(section.id) || ids.has(section.id) || typeof section.label !== 'string' || !section.label.trim() || section.label.length > 100 || typeof section.text !== 'string') throw new Error('Seção inválida ou duplicada.');
    ids.add(section.id); total += section.text.length;
  }
  if (total > 100000 || s.sequence.some(id => typeof id !== 'string' || !ids.has(id))) throw new Error('Texto muito longo ou sequência com seção inexistente.');
  return { id: s.id, title: s.title.trim(), author: s.author.trim(), archived: s.archived, sections: s.sections.map(({id,label,text}) => ({id,label:label.trim(),text})), sequence: [...s.sequence], ...(s.music?{music:validateMusic(s.music)}:{}) };
}
export function songRecord(value: unknown, existing?: LibraryRecord): LibraryRecord {
  const s = validateSong(value); const now = new Date().toISOString();
  return validateRecord({ id:s.id, kind:'song', title:s.title, data:{ schemaVersion:2, ...(s.music?{music:s.music,notation:s.sections.map(section=>({id:section.id,lines:parseChords(section.text).lines}))}:{}), author:s.author, archived:s.archived, sections:s.sections, sequence:s.sequence }, createdAt:existing?.createdAt ?? now, updatedAt:now });
}
export function readSong(record: LibraryRecord): Song {
  return validateSong({ ...record.data, id:record.id, title:record.title });
}
export function searchSong(song: Song, query: string): boolean {
  const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR');
  return normalize([song.title,song.author,...song.sections.map(s => s.text)].join(' ')).includes(normalize(query.trim()));
}
