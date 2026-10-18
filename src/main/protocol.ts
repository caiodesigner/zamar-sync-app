import type { Snapshot } from '../shared/contracts';
import { validateText } from './storage';
export function requestPayload(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value) || (value as { version?: unknown }).version !== 1 || !Object.hasOwn(value, 'payload')) throw new Error('Mensagem incompatível. Reinicie o aplicativo atualizado.');
  return (value as { payload: unknown }).payload;
}
export function initialPresentation(serialized?: string): Snapshot {
  let text = ''; let revision = 0;
  if (serialized) {
    try { const saved = JSON.parse(serialized); text = validateText(saved.text); if (Number.isSafeInteger(saved.revision) && saved.revision >= 0 && saved.revision < Number.MAX_SAFE_INTEGER - 1000) revision = saved.revision; } catch { /* Invalid checkpoints never become public content. */ }
  }
  return { revision: revision + 1, text, black: true, outputOpen: false, mode: 'closed', status: 'Saída fechada; conteúdo preservado para retomada explícita' };
}
