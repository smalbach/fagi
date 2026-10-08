// Individual variation (VARY): every Fagi is born a little different.
//
// Her genome carries `vary`, one multiplier per trait (VARY.weight's keys),
// around 1: ×1.12 speed, ×0.93 reserves, ×1.05 thirst... biology.js folds
// them into her body, which the rest of the simulation already reads
// (bodyOf, bodyMult), so a faster or thirstier Fagi needs nothing else.
//
// Drawn in log space: a gap up and the same gap down are equally likely, and
// a multiplier never reaches 0. Founders draw theirs around 1 (VARY.founders);
// a newborn takes her parents' average, weighted by VARY.heritability, plus a
// fresh draw for the rest (VARY.births). With heritability, the same world
// pushes a colony's traits one way: whoever does better leaves more young.
//
// Nothing here draws a random number unless its switch is on, so a run with
// variation off draws the same stream as before it existed.

import { VARY } from './config.js';

export const VARY_TRAITS = Object.keys(VARY.weight);

const round = (v) => Math.round(v * 1000) / 1000;
const gauss = (rnd) => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
const bounded = (v) => Math.max(1 - VARY.limit, Math.min(1 + VARY.limit, v));

// A trait's multiplier from a log-scale value.
const fromLog = (k, x) => round(bounded(Math.exp(x * (VARY.weight[k] ?? 0))));

// A founder's: each trait drawn around 1. null with VARY.founders off.
export function founderVary(rnd = Math.random) {
  if (!VARY.founders || !(VARY.spread > 0)) return null;
  const out = {};
  for (const k of VARY_TRAITS) out[k] = fromLog(k, gauss(rnd) * VARY.spread);
  return out;
}

// A newborn's, from her parents' (either may be null: a standard parent).
// The fresh part keeps the colony's spread about where VARY.spread sets it
// instead of shrinking with every generation of averaging. null with
// VARY.births off: she is born standard.
export function childVary(mother, father, rnd = Math.random) {
  if (!VARY.births) return null;
  const h = Math.max(0, Math.min(1, VARY.heritability));
  const fresh = VARY.spread * Math.sqrt(1 - h * h / 2);
  const out = {};
  for (const k of VARY_TRAITS) {
    const w = VARY.weight[k] || 1;
    // Back to the log value the parent drew (the weight is re-applied below).
    const logOf = (p) => (p?.[k] ? Math.log(p[k]) / w : 0);
    const mid = (logOf(mother) + logOf(father ?? mother)) / 2;
    out[k] = fromLog(k, h * mid + gauss(rnd) * fresh);
  }
  return out;
}

// What she carries, for whoever shows it: the traits that set her apart,
// biggest gap first, as [trait, multiplier].
export function standOut(vary, min = 0.03) {
  if (!vary) return [];
  return Object.entries(vary).filter(([, v]) => Math.abs(v - 1) >= min).sort((a, b) => Math.abs(b[1] - 1) - Math.abs(a[1] - 1));
}
