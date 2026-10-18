import type { EntityKind, LibraryRecord } from './models';
export type Monitor = { id: number; label: string; primary: boolean; availableForProjection: boolean };
export type Snapshot = { revision: number; text: string; black: boolean; outputOpen: boolean; status: string; mode: 'closed' | 'rehearsal' | 'external' };
export type Initial = { draft: string; dataPath: string; monitors: Monitor[]; snapshot: Snapshot };
export interface Bridge {
  initial(): Promise<Initial>;
  save(text: string): Promise<void>;
  present(text: string): Promise<void>;
  openOutput(id: number | null): Promise<boolean>;
  closeOutput(): Promise<void>;
  black(): Promise<void>;
  listRecords(kind: EntityKind): Promise<LibraryRecord[]>;
  saveRecord(record: LibraryRecord): Promise<LibraryRecord>;
  createBackup(): Promise<string | null>;
  restoreBackup(): Promise<{ draft: string; previousBackup: string } | null>;
  onState(callback: (snapshot: Snapshot) => void): () => void;
}
