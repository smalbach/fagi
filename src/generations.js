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
// With GEN.sexual (and SEX on) a newborn has two parents: each innate bias
// comes whole from one of them (or their average, GEN.blend), then mutates,
// and her body genes are their average, mutated. Memories never pass through
// the genome: only predispositions do. What an elder learned reaches her by
// culture alone (teach).
//
// Nothing here runs in a normal game: batch --generations uses it
// (scripts/batch/generations.js).

import { GEN } from './config.js';
import { TRAITS } from './chemistry.js';
import { pass } from './social.js';
import { restoreHabits, habitsSnapshot } from './habits.js';
import { BODY_TRAITS, bodyFor, energyMax } from './biology.js';

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

// Box-Muller: a normal step from two uniform numbers.
const gauss = (rnd) => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());

// A child's genome: the parent's, each bias nudged by a small gaussian step.
// `rnd` is the random source (seeded in batch).
export function mutate(genome, rnd = Math.random) {
  const cues = {};
  for (const c of ALL_CUES) {
    const g = gauss(rnd);
    const w = clamp((genome.cues[c] ?? 0) + g * GEN.mutation);
    if (Math.abs(w) >= 0.01) cues[c] = round(w);
  }
  return { cues };
}

// A child's genome from two parents: recombined first, mutated after, and
// kept inside its range. `parents` names who they were, for kinship.
export function recombine(mother, father, rnd = Math.random, parents = null) {
  const cues = {};
  for (const c of ALL_CUES) {
    const m = mother.cues[c] ?? 0;
    const f = father.cues[c] ?? 0;
    const allele = GEN.blend ? (m + f) / 2 : (rnd() < 0.5 ? m : f);
    const w = clamp(allele + gauss(rnd) * GEN.mutation);
    if (Math.abs(w) >= 0.01) cues[c] = round(w);
  }
  const [lo, hi] = GEN.bodyRange;
  const body = {};
  for (const k of BODY_TRAITS) {
    const mid = ((mother.body?.[k] ?? 1) + (father.body?.[k] ?? 1)) / 2;
    body[k] = round(Math.max(lo, Math.min(hi, mid + gauss(rnd) * GEN.bodyMutation)));
  }
  return parents ? { cues, body, parents } : { cues, body };
}

// How different two genomes are: mean absolute gap over every bias and body
// gene. A population's diversity is its mean over every pair.
export function geneticDistance(a, b) {
  let sum = 0;
  for (const c of ALL_CUES) sum += Math.abs((a.cues[c] ?? 0) - (b.cues[c] ?? 0));
  for (const k of BODY_TRAITS) sum += Math.abs((a.body?.[k] ?? 1) - (b.body?.[k] ?? 1));
  return sum / (ALL_CUES.length + BODY_TRAITS.length);
}

export function diversity(genomes) {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < genomes.length; i++) {
    for (let j = i + 1; j < genomes.length; j++) { sum += geneticDistance(genomes[i], genomes[j]); n++; }
  }
  return n ? round(sum / n) : 0;
}

// Born with her genome: each bias is a trait weight she already has, trusted
// as if she had met it GEN.innateN times. Body genes shape her body.
export function applyGenome(fagi, genome) {
  fagi.genome = genome;
  if (genome.body) {
    fagi.body = bodyFor(fagi.sex, genome);
    fagi.energy = energyMax(fagi);
  }
  if (!GEN.genes) return;
  for (const [c, w] of Object.entries(genome.cues)) {
    fagi.brain.cues[c] = { w, n: GEN.innateN, lastAt: 0, innate: true };
  }
}

// Raised by an elder: her rules (in the colony's format, SOCIAL.format),
// trusted less, and her habits. Returns how many items she was taught.
export function teach(child, elder) {
  if (!GEN.culture) return 0;
  const n = pass(elder, child, 0, { kind: 'born', scale: GEN.cultureTrust, budget: GEN.budget }).length;
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

// How well one did, for choosing parents: how long she lived, plus what
// she stored for the colony.
export const fitness = (f) => f.age + GEN.storedWorth * (f.stored ?? 0);
