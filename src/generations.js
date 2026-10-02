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

import { GEN, CHOICE, SITES } from './config.js';
import { TRAITS } from './chemistry.js';
import { pass } from './social.js';
import { restoreHabits, habitsSnapshot } from './habits.js';
import { BODY_TRAITS, bodyFor, energyMax } from './biology.js';
import { morphOn, inheritMorph, baldwinOn, inheritPlastic } from './morph.js';
import { programOf, line } from './program.js';

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

// Foraging genes (phase 9, way 2; spec §12.11). What is still innate in how
// she chooses between going back and exploring is inherited, not set:
//   explore   her starting belief that exploring finds food: > 0 hopeful, < 0 wary
//   site      the same, for going back to a place where she once found food
//   memory    how fast what she lived fades: > 0 faster, < 0 slower
//   patience  how long she searches before calling a search fruitless
// Each is a number in [-1, 1]; founders carry 0, which is exactly the choice
// of way 1. They mutate like the rest, and only who lives and breeds decides
// which values go on. They exist only with the learned choice on (CHOICE,
// SITES): every other run draws the same random numbers as before.
export const FORAGE_GENES = ['explore', 'site', 'memory', 'patience'];
export const forageGenesOn = () => Boolean(CHOICE.enabled && SITES.enabled && CHOICE.genes && CHOICE.mode === 1);

// The gene's value in her, 0 if she has none (a founder, or genes off).
export const forageGene = (fagi, k) => (forageGenesOn() ? fagi.genome?.forage?.[k] ?? 0 : 0);

// A starting belief from a gene: two counts ≥ 1, as if she had already seen
// up to two cases go one way (Beta prior).
export function priorOf(g) {
  return { a: 1 + Math.max(0, 2 * g), b: 1 + Math.max(0, -2 * g) };
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
  const out = { cues };
  if (forageGenesOn()) {
    out.forage = {};
    for (const k of FORAGE_GENES) out.forage[k] = round(clamp((genome.forage?.[k] ?? 0) + gauss(rnd) * GEN.mutation));
  }
  // Her organs (MORPH), from her one parent's.
  if (morphOn()) out.morph = inheritMorph(genome.morph, null, rnd);
  if (baldwinOn()) out.plastic = inheritPlastic(genome.plastic, genome.plastic, rnd);
  return out;
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
  const out = { cues, body };
  if (forageGenesOn()) {
    out.forage = {};
    for (const k of FORAGE_GENES) {
      const m = mother.forage?.[k] ?? 0;
      const f = father.forage?.[k] ?? 0;
      const allele = GEN.blend ? (m + f) / 2 : (rnd() < 0.5 ? m : f);
      out.forage[k] = round(clamp(allele + gauss(rnd) * GEN.mutation));
    }
  }
  // Her organs (MORPH): between her parents', then a step.
  if (morphOn()) out.morph = inheritMorph(mother.morph, father.morph, rnd);
  if (baldwinOn()) out.plastic = inheritPlastic(mother.plastic, father.plastic, rnd);
  return parents ? { ...out, parents } : out;
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
  // What she carries of her organs starts as what she inherited (MORPH),
  // moved by her parents' mark if one came with her (epigenetic inheritance).
  if (genome.morph) {
    fagi.epi = genome.epi ? { ...genome.epi } : null;
    fagi.morph = Object.fromEntries(Object.entries(genome.morph).map(([k, v]) => [k, genome.epi ? v * (genome.epi[k] ?? 1) : v]));
  }
  if (genome.body || genome.morph) {
    fagi.body = bodyFor(fagi.sex, genome, fagi.morph);
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
  if (GEN.cultureProgram) teachProgram(child, elder);
  return n;
}

// Cultural transmission of self-rewritten programmatic lines:
// Elder passes non-retired custom rules to juvenile as source 'told'.
export function teachProgram(child, elder) {
  if (!elder?.brain || !child?.brain) return 0;
  const elderProg = programOf(elder);
  const childProg = programOf(child);
  const ownLines = elderProg.lines.filter((l) => !l.retired && l.source !== 'born');
  if (!ownLines.length) return 0;

  let count = 0;
  for (const l of ownLines) {
    if (childProg.lines.some((cl) => !cl.retired && cl.id === l.id)) continue;
    const overIdx = childProg.lines.findIndex((cl) => cl.id === l.over);
    if (overIdx < 0) continue;

    const copy = line(l.id, {
      tier: l.tier,
      do: l.do,
      ...(l.if ? { if: l.if } : {}),
      ...(l.chain ? { chain: l.chain } : {}),
      source: 'told',
      learnedAt: 0,
      from: l.from,
      over: l.over,
      why: `taught by elder #${elder.id ?? 1}`,
    });

    childProg.lines.splice(overIdx, 0, copy);
    count += 1;
  }

  if (count > 0) {
    childProg.seq = (childProg.seq ?? 0) + 1;
    child.brain.lastProgram = {
      n: (child.brain.lastProgram?.n ?? 0) + 1,
      kind: 'written',
      id: ownLines[0].id,
      from: ownLines[0].from,
      over: ownLines[0].over,
      source: 'told',
      why: `taught ${count} program lines by elder #${elder.id ?? 1}`,
    };
    child.brain.version = (child.brain.version ?? 0) + 1;
  }
  return count;
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
