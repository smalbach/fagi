// The evolving body (MORPH; docs/research/libera/cuerpo-evolutivo.md): organs
// she inherits, each a multiplier around 1, with what it gives and what it
// costs, as in a real body:
//
//   brain     remembers longer (memory fades slower)   costly tissue; shorter life, slower breeding
//   gut       more from each fruit, tolerates poison   costly tissue
//   muscle    faster                                   the largest tissue to keep
//   eyes      sees farther                             costly even when unused
//   antennae  smells farther                           a little
//   size      more reserves; less burn per gram;       more burn in all; slower; needs more fruit
//             keeps its warmth better (Bergmann: less surface per volume)
//
// Every cost is paid in her resting burn: hunger rises and energy drains
// faster the more tissue she keeps. Organs cost more than linearly as they
// grow (MORPH.costPower), so past a point a bigger one does not pay: that,
// and MORPH.range, is the physical limit. Benefits grow less than linearly
// (MORPH.gain).
//
// What she inherits is genome.morph; what she carries is fagi.morph, which is
// where what she lives will later move it (plasticity). Both are folded into
// fagi.body (biology.js) once, when they change, so the rest of the code reads
// one multiplier per thing. With MORPH off nobody has morph genes, every
// multiplier is 1 and no random number is drawn here.

import { MORPH } from './config.js';

export const MORPH_TRAITS = ['brain', 'gut', 'muscle', 'eyes', 'antennae', 'size'];

const round = (v) => Math.round(v * 1000) / 1000;
const clampGene = (v) => Math.max(MORPH.range[0], Math.min(MORPH.range[1], v));
const gauss = (rnd) => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());

export const morphOn = () => Boolean(MORPH.enabled);
export const INHERIT = { darwin: 0, baldwin: 1, epigenetic: 2 };
export const baldwinOn = () => morphOn() && MORPH.inherit === INHERIT.baldwin;
export const epigeneticOn = () => morphOn() && MORPH.inherit === INHERIT.epigenetic;

// --- inheritance of what was lived (MORPH.inherit) ---------------------------

const clampPlastic = (v) => Math.max(MORPH.baldwin.range[0], Math.min(MORPH.baldwin.range[1], v));

// Baldwin: how much she can change, a gene around 1 (1 = MORPH.plastic as set).
export function founderPlastic(rnd = Math.random) {
  return round(clampPlastic(1 + gauss(rnd) * MORPH.baldwin.founders));
}
export function inheritPlastic(mother = 1, father = mother, rnd = Math.random) {
  return round(clampPlastic(((mother ?? 1) + (father ?? 1)) / 2 + gauss(rnd) * MORPH.baldwin.mutation));
}

// What keeping that capacity costs: resting burn, 1 at a plasticity gene of 1.
export const plasticCost = (genome) => (baldwinOn() && genome?.plastic != null ? Math.max(0.5, 1 + MORPH.baldwin.cost * (genome.plastic - 1)) : 1);

// Epigenetic: the mark a child gets at conception, organ by organ. From each
// parent, what she lived beyond where she started (carried / (gene × her own
// mark)) to the power MORPH.epigenetic.share, times her own mark faded
// (keep); the child's is the geometric mean of both parents', kept within
// the plastic range.
export function epigeneticMark(mother, father = null) {
  const E = MORPH.epigenetic;
  const max = MORPH.plastic.max;
  const of = (p, k) => {
    if (!p?.morph || !p.genome?.morph) return 1;
    const mark = p.epi?.[k] ?? 1;
    const lived = (p.morph[k] ?? 1) / ((p.genome.morph[k] ?? 1) * mark);
    return mark ** E.keep * lived ** E.share;
  };
  const out = {};
  for (const k of MORPH_TRAITS) {
    const v = father ? Math.sqrt(of(mother, k) * of(father, k)) : of(mother, k);
    out[k] = round(Math.max(1 - max, Math.min(1 + max, v)));
  }
  return out;
}

// A founder's genes: around 1, a little apart, so there is something to select.
export function founderMorph(rnd = Math.random) {
  const out = {};
  for (const k of MORPH_TRAITS) out[k] = round(clampGene(Math.exp(gauss(rnd) * MORPH.founders)));
  return out;
}

// A child's genes from one parent (clonal) or two: each gene the geometric
// mean of the parents', then a log-normal step.
export function inheritMorph(mother, father = null, rnd = Math.random) {
  const out = {};
  for (const k of MORPH_TRAITS) {
    const m = mother?.[k] ?? 1;
    const f = father ? father[k] ?? 1 : m;
    out[k] = round(clampGene(Math.sqrt(m * f) * Math.exp(gauss(rnd) * MORPH.mutation)));
  }
  return out;
}

// What her organs cost at rest, relative to today's Fagi (1 with every organ
// at 1): the body's own share plus each organ's, growing faster than the organ.
// Written as 1 plus what each organ adds over its share, so all ones is exactly 1.
export function tissueLoad(m) {
  let load = 1;
  for (const [k, w] of Object.entries(MORPH.tissue)) load += w * ((m[k] ?? 1) ** MORPH.costPower - 1);
  return load;
}

// Her organs as multipliers on what the body does (biology.js folds them in).
// Hunger is measured against a fixed scale, so a bigger body (more reserves)
// feels the same burn as less hunger, and the same fruit as less relief.
export function morphBody(m) {
  const g = MORPH.gain;
  const size = m.size ?? 1;
  const load = tissueLoad(m);
  return {
    metabolism: load * size ** (MORPH.kleiber - 1),   // hunger per second, on the fixed scale
    drain: load * size ** MORPH.kleiber,               // energy per second (her reserve grows with size)
    energyMax: size,
    insulation: size ** (1 / 3),   // surface ∝ size^(2/3) over volume ∝ size
    speed: (m.muscle ?? 1) ** g.speed * size ** -MORPH.sizeSpeed,
    view: (m.eyes ?? 1) ** g.view,
    smell: (m.antennae ?? 1) ** g.smell,
    memory: (m.brain ?? 1) ** g.memory,
    digest: (m.gut ?? 1) ** g.digest / size,
    tolerance: (m.gut ?? 1) ** g.tolerance,
    life: (m.brain ?? 1) ** -MORPH.brainLife,
    brood: (m.brain ?? 1) ** MORPH.brainBrood,
  };
}

// --- plasticity: what she lives moves the organs she carries ----------------
//
// Each organ follows its own use, averaged over MORPH.plastic.window seconds:
//
//   muscle    walking                  (more walking, more muscle)
//   gut       bites a day              (more eating, a bigger gut; a fast shrinks it)
//   brain     time out foraging        (experience, not age)
//   eyes      time out in daylight     (unused in the dark, they waste)
//   antennae  time smelling something
//   size      how well fed while young (fixed once she is grown)
//
// The organ she carries moves toward her gene × what its use asks, never
// further than MORPH.plastic.max from her gene, slowly (MORPH.plastic.tau), and
// growing tissue costs hunger. Her genes do not change: what her daughters
// inherit is her genome (darwinian inheritance). Nothing here draws a random
// number, and with MORPH or its plasticity off nothing runs.

const USE_OF = { muscle: 'move', gut: 'eat', brain: 'out', eyes: 'light', antennae: 'smell', size: 'fed' };
const SHARE = { size: 0.3 };   // what growing her whole body costs, as a share of her burn

export const plasticOn = () => Boolean(MORPH.enabled && MORPH.plastic?.enabled);

// What each organ's use asks of it, as a factor on her gene. `gain` scales
// how strongly it follows (her plasticity gene, with Baldwin; else 1).
export function targetOf(k, use, gain = 1) {
  const P = MORPH.plastic;
  const ask = 1 + gain * P.amp[k] * ((use[USE_OF[k]] ?? P.ref[USE_OF[k]]) / P.ref[USE_OF[k]] - 1);
  return Math.max(1 - P.max, Math.min(1 + P.max, ask));
}

// Once a frame, after she has acted. `out`: is she outside the nest. Returns
// whether her organs moved enough that her body has to be worked out again.
export function updatePlasticity(fagi, out, dt) {
  if (!plasticOn() || !fagi.morph || !fagi.genome?.morph) return false;
  const P = MORPH.plastic;
  const use = (fagi.use ??= { ...P.ref, bites: fagi.eaten ?? 0 });
  const k = Math.min(1, dt / P.window);
  const smelled = (fagi.perceived?.smelledOnes?.length ?? 0) > 0;
  use.move += ((fagi.moving ? 1 : 0) - use.move) * k;
  use.out += ((out ? 1 : 0) - use.out) * k;
  use.light += ((out && !fagi.dark ? 1 : 0) - use.light) * k;
  use.smell += ((smelled ? 1 : 0) - use.smell) * k;
  // Bites a day (180 s), as a running rate.
  const bites = (fagi.eaten ?? 0) - use.bites;
  use.bites = fagi.eaten ?? 0;
  use.eat += ((dt > 0 ? (bites * 180) / dt : 0) - use.eat) * k;
  const young = fagi.lifeStage === 'juvenile';
  if (young) use.fed += ((1 - Math.min(1, (fagi.hunger ?? 0) / 100)) - use.fed) * k;

  const step = Math.min(1, dt / P.tau);
  // Baldwin: how strongly she follows her use is hers. Epigenetic: her
  // parents' mark moves where each organ settles.
  const gain = baldwinOn() ? fagi.genome.plastic ?? 1 : 1;
  const marks = epigeneticOn() ? fagi.epi : null;
  let moved = 0;
  for (const o of MORPH_TRAITS) {
    if (o === 'size' && !young) continue;   // grown: her size is set
    const gene = fagi.genome.morph[o] ?? 1;
    const now = fagi.morph[o] ?? gene;
    const settle = Math.max(1 - P.max, Math.min(1 + P.max, (marks?.[o] ?? 1) * targetOf(o, use, gain)));
    const goal = gene * settle;
    const next = now + (goal - now) * step;
    if (next > now) {
      // Building tissue costs: hunger, by the organ's share of her burn.
      const share = MORPH.tissue[o] ?? SHARE[o] ?? 0;
      fagi.hunger = Math.min(100, (fagi.hunger ?? 0) + P.build * share * ((next - now) / gene) * 100);
    }
    fagi.morph[o] = next;
    moved += Math.abs(next - now);
  }
  fagi.morphMoved = (fagi.morphMoved ?? 0) + moved;
  if (fagi.morphMoved < 0.01) return false;
  fagi.morphMoved = 0;
  return true;
}
