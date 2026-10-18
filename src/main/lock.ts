import { closeSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
export function acquireStoreLock(directory: string): () => void {
  mkdirSync(directory, { recursive: true });
  const path = join(directory, '.store.lock');
  const token = randomUUID();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = openSync(path, 'wx', 0o600);
      try { writeFileSync(fd, JSON.stringify({ pid: process.pid, token })); }
      catch (error) { unlinkSync(path); throw error; }
      finally { closeSync(fd); }
      return () => { if (existsSync(path) && JSON.parse(readFileSync(path, 'utf8')).token === token) unlinkSync(path); };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      let pid: number;
      try { pid = JSON.parse(readFileSync(path, 'utf8')).pid; if (!Number.isSafeInteger(pid) || pid <= 0) throw new Error(); }
      catch { throw new Error('Bloqueio de dados inválido. Confirme que o aplicativo está fechado antes de remover .store.lock.'); }
      try { process.kill(pid, 0); } catch (status) {
        if ((status as NodeJS.ErrnoException).code === 'ESRCH' && attempt === 0) { unlinkSync(path); continue; }
      }
      throw new Error('Esta pasta de dados já está aberta em outra instância. Feche-a antes de continuar.');
    }
  }
  throw new Error('Não foi possível bloquear a pasta de dados.');
}
