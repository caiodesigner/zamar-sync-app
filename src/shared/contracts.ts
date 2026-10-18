import type { Theme, Catalog, Content, ContentKind } from './content';
import type { Song } from './songs';
import type { EntityKind, LibraryRecord } from './models';
export type Monitor = { id: number; label: string; primary: boolean; availableForProjection: boolean };
export type Snapshot = { revision: number; text: string; theme: Theme; black: boolean; hidden: boolean; outputOpen: boolean; status: string; mode: 'closed' | 'rehearsal' | 'external' };
export type Initial = { draft: string; dataPath: string; monitors: Monitor[]; snapshot: Snapshot };
export interface Bridge {
  initial(): Promise<Initial>;
  save(text: string): Promise<void>;
  present(text: string | { text:string; theme:Theme }): Promise<void>;
  openOutput(id: number | null): Promise<boolean>;
  closeOutput(): Promise<void>;
  black(): Promise<void>;
  hideText(): Promise<void>;
  listSongs(): Promise<{ songs: Song[]; skipped: number }>;
  saveSong(song: Song): Promise<Song>;
  catalog(): Promise<Catalog>;
  saveContent(kind:ContentKind, value:Content): Promise<Content>;
  selectProgram(id:string): Promise<void>;
  importImage(): Promise<string|null>;
  listRecords(kind: EntityKind): Promise<LibraryRecord[]>;
  saveRecord(record: LibraryRecord): Promise<LibraryRecord>;
  createBackup(): Promise<string | null>;
  restoreBackup(): Promise<{ draft: string; previousBackup: string } | null>;
  onState(callback: (snapshot: Snapshot) => void): () => void;
}
