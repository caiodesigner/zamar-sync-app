export type DisplayGeometry = { id: number; bounds: { x: number; y: number; width: number; height: number } };
export function separateDisplay(candidate: DisplayGeometry, operator: DisplayGeometry): boolean {
  if (candidate.id === operator.id) return false;
  const a = candidate.bounds, b = operator.bounds;
  return a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;
}
export function presentationTarget(request: unknown, displays: DisplayGeometry[], operator: DisplayGeometry): DisplayGeometry | null {
  if (request === null) return null;
  if (typeof request !== 'number' || !Number.isSafeInteger(request)) throw new Error('Monitor inválido.');
  const target = displays.find(display => display.id === request);
  if (!target) throw new Error('Monitor indisponível. Atualize a seleção.');
  return separateDisplay(target, operator) ? target : null;
}
