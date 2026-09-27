// Lecturas pequeñas del estado de Fagi que usan varias secciones del mapa.
// Solo leen: no crean creencias ni tocan nada.

import { MEMORY } from '../config.js';

// La clave detrás de lo que Fagi está haciendo ahora, si hay alguna: la de su
// objetivo actual (comida o agua), o si no, la del rastro que sigue de olfato.
export function intentionKey(fagi) {
  if (fagi.target?.type && (fagi.targetKind === 'food' || fagi.targetKind === 'water')) return fagi.target.type;
  if (fagi.targetKind === 'water') return 'water';
  if (fagi.trailKey) return fagi.trailKey;
  return null;
}

export function ruleOf(rules, key) {
  const alive = rules.list.filter((r) => !r.retired && !rules.quarantined?.has(r.id) && r.when.key === key);
  return alive.find((r) => r.verdict === 'avoid') ?? alive.find((r) => r.verdict === 'prefer') ?? null;
}

// Lo mismo que memory.weight, sin crear la creencia si no existe.
export function weightOf(r) {
  return r.value * (MEMORY.floor + (1 - MEMORY.floor) * r.confidence);
}

// El cambio de creencia de un episodio: en vivo cuelga de ep.cambio; en una
// repetición viene ya aplanado (recorder.js).
export function changeOf(ep) {
  if (ep.change) return ep.change;
  if (ep.kind) return { kind: ep.kind, before: ep.before, after: ep.after };
  return null;
}

export function signo(v, d = 2) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(d)}`;
}
