// Generations: what a newborn brings with her, and from whom.
//
// Two ways, kept apart so they can be compared:
//   - culture: the newborn is raised by an elder who survived. She is taught
//     the elder's rules, marked { source: { kind: 'born' } } and trusted
//     GEN.cultureTrust of what the elder trusted them, and her habits. Culture
//     is fast (one generation) but copies mistakes too: myths included;
//   - genes: a genome of innate biases, one number per trait ('smell:sour' ->
//     -0.4: born wary of sour things). It is inherited from parents chosen by
//     how long they lived, with small random mutations. Nothing she learns in
//     life goes into it: only who survives decides which genomes go on.
//     Genes are slow, but they cannot be talked into a myth.
//
// Innate biases enter her head as trait weights (learned/cues.js) she was born
// with: the same numbers learning would move, so nature and nurture add up.
//
// Nothing here runs in a normal game: batch --generations uses it
// (scripts/batch/generations.js).

import { GEN, SOCIAL } from './config.js';
import { TRAITS } from './chemistry.js';
import { upsertRule } from './learned/rules.js';
import { trustOf } from './social.js';
import { restoreHabits, habitsSnapshot } from './habits.js';

// Every trait a fruit can have, rotten fruit's smell included.
export const ALL_CUES = [
  ...Object.entries(TRAITS).flatMap(([dim, values]) => values.map((v) => `${dim}:${v}`)),
  'smell:rotten',
];

const clamp = (v) => Math.max(-1, Math.min(1, v));
const round = (v, d = 3) => Math.round(v * 10 ** d) / 10 ** d;

export function createGenome() {
  return { cues: {} };
}

// A child's genome: the parent's, each bias nudged by a small gaussian step.
// `rnd` is the random source (seeded in batch).
export function mutate(genome, rnd = Math.random) {
  const cues = {};
  for (const c of ALL_CUES) {
    // Box-Muller: a normal step from two uniform numbers.
    const g = Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
    const w = clamp((genome.cues[c] ?? 0) + g * GEN.mutation);
    if (Math.abs(w) >= 0.01) cues[c] = round(w);
  }
  return { cues };
}

// Born with her genome: each bias is a trait weight she already has, trusted
// as if she had met it GEN.innateN times.
export function applyGenome(fagi, genome) {
  fagi.genome = genome;
  if (!GEN.genes) return;
  for (const [c, w] of Object.entries(genome.cues)) {
    fagi.brain.cues[c] = { w, n: GEN.innateN, lastAt: 0, innate: true };
  }
}

// Raised by an elder: her rules, trusted less, and her habits.
export function teach(child, elder) {
  if (!GEN.culture) return 0;
  let n = 0;
  for (const r of elder.brain.rules.list) {
    if (r.retired || elder.brain.rules.quarantined.has(r.id)) continue;
    const trust = trustOf(r) * GEN.cultureTrust;
    if (trust < SOCIAL.minTrust) continue;
    const copy = JSON.parse(JSON.stringify(r));
    delete copy.revisedAt;
    upsertRule(child.brain.rules, {
      ...copy,
      weight: round(r.weight * GEN.cultureTrust),
      learnedAt: 0,
      source: { kind: 'born', from: elder.id, at: 0, trust: round(trust) },
    });
    n++;
  }
  if (GEN.habits) child.brain.habits = restoreHabits(habitsSnapshot(elder.brain.habits));
  return n;
}

// Pick one by weight (roulette). `weights` are ≥ 0; all zero picks uniformly.
export function pick(items, weights, rnd = Math.random) {
  const total = weights.reduce((a, w) => a + w, 0);
  if (total <= 0) return items[Math.floor(rnd() * items.length)];
  let x = rnd() * total;
  for (let i = 0; i < items.length; i++) {
    x -= weights[i];
    if (x <= 0) return items[i];
  }
  return items.at(-1);
}

// How well an ant did, for choosing parents: how long she lived, plus what
// she stored for the colony.
export const fitness = (f) => f.age + GEN.storedWorth * (f.stored ?? 0);
