// Small readings of Fagi's state used by several sections of the map.
// They only read: they create no beliefs and touch nothing.

import { MEMORY } from '../config.js';

// The key behind what Fagi is doing now, if there is one: that of her
// current target (food or water), or failing that, the scent trail she's following.
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

// Same as memory.weight, without creating the belief if it doesn't exist.
export function weightOf(r) {
  return r.value * (MEMORY.floor + (1 - MEMORY.floor) * r.confidence);
}

// An episode's belief change: live, it hangs off ep.change; in a
// replay it comes already flattened (recorder/recorder.js).
export function changeOf(ep) {
  if (ep.change) return ep.change;
  if (ep.kind) return { kind: ep.kind, before: ep.before, after: ep.after };
  return null;
}

export function signo(v, d = 2) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(d)}`;
}
