// One lineage: generations of colonies living one after another in a world
// whose chemistry may change, each generation raised by the survivors of the
// last. Returns one row per generation and the genealogy of every belief that
// went from ant to ant.
//
// Two random streams, both from the seed:
//   world: the chemistries, the catalogue of species and each generation's
//          map. The same for every cell of a design with the same seed, so
//          cells are compared on the same worlds (common random numbers);
//   life:  what each ant meets, whom she talks to, who sees her eat.

import * as CONFIG from '../../src/config.js';
import { HUNGER, SOCIAL, CARRY } from '../../src/config.js';
import {
  createChemistry, changeChemistry, createSpecies, registerSpecies, speciesUnder, speciesKey,
  feedOf, FEED,
} from '../../src/chemistry.js';
import { createFagi } from '../../src/fagi.js';
import { eat } from '../../src/feeding.js';
import { learnSeen } from '../../src/brain.js';
import { decayMemory } from '../../src/memory.js';
import { updateEffects, statMult } from '../../src/effects.js';
import { resolveEpisodes } from '../../src/episodes.js';
import { resolveVitalFailure } from '../../src/needs.js';
import { refreshRules } from '../../src/learned/synth.js';
import { observeHabits, deathLesson } from '../../src/habits.js';
import { pass } from '../../src/social.js';
import { teach, pick, fitness, applyGenome, createGenome } from '../../src/generations.js';
import { rng, withRng } from '../../scripts/batch/random.js';
import { epochOf } from './params.js';
import { theoryOf, seed as seedTheory } from './theory.js';
import { accuracy, falseRules, ruleIsFalse } from './truth.js';
import { scoreOf, learns, CLASSES } from './agents.js';

const NO_PANTRY = { stored: 0, edible: 0 };
const round = (v, d = 3) => Math.round(v * 10 ** d) / 10 ** d;
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Runs `fn` with src/config.js changed as `sets` says ({ 'SOCIAL.trust': 0.5 }),
// and puts everything back afterwards.
export function withConfig(sets, fn) {
  const saved = [];
  for (const [path, value] of Object.entries(sets)) {
    const [group, key] = path.split('.');
    if (!CONFIG[group] || !(key in CONFIG[group])) throw new Error(`unknown setting: ${path}`);
    saved.push([CONFIG[group], key, CONFIG[group][key]]);
    CONFIG[group][key] = value;
  }
  try { return fn(); } finally { for (const [obj, key, v] of saved.reverse()) obj[key] = v; }
}

export function configFor(p) {
  const none = p.format === 'none';
  return {
    'SOCIAL.format': none ? 'rule' : p.format, 'SOCIAL.budget': p.budget, 'GEN.budget': p.budget,
    'GEN.culture': none ? 0 : p.culture, 'SOCIAL.share': none ? 0 : 1, 'GEN.genes': 0,
    ...p.sets,
  };
}

export function runLineage(p, seed) {
  return withConfig(configFor(p), () => lineage(p, seed));
}

// The chemistries of every epoch, and a catalogue with at least two poisons and
// two foods under each of them.
function makeWorld(p, rnd) {
  const chems = [createChemistry(rnd, { family: p.family, dim: p.dim })];
  const epochs = epochOf(p, p.generations - 1);
  for (let e = 1; e <= epochs; e++) chems.push(changeChemistry(chems[e - 1], p.change, rnd));
  const byKey = new Map();
  for (const chem of chems) for (const s of createSpecies(chem, 4, rnd)) byKey.set(s.key, s.spec.traits);
  for (let tries = 0; byKey.size < p.catalogue && tries < 100; tries++) {
    for (const s of createSpecies(chems[0], p.catalogue, rnd)) if (byKey.size < p.catalogue) byKey.set(s.key, s.spec.traits);
  }
  return { chems, catalogue: [...byKey.values()].slice(0, Math.max(p.catalogue, byKey.size)) };
}

// This generation's map: perMap species, with at least one poison and one food.
function drawMap(p, chem, catalogue, rnd) {
  let map = [];
  for (let tries = 0; tries < 50; tries++) {
    const pool = [...catalogue];
    map = [];
    while (map.length < p.perMap) map.push(...pool.splice(Math.floor(rnd() * pool.length), 1));
    const feeds = map.map((t) => feedOf(chem, t));
    if (feeds.includes('poison') && feeds.includes('nourishing')) break;
  }
  return map;
}

function lineage(p, seed) {
  const worldRnd = rng(seed * 7919 + 17);
  const lifeRnd = rng(seed * 104729 + 3);
  const { chems, catalogue } = makeWorld(p, worldRnd);
  const rows = [];
  const genealogy = new Map();   // origin -> what happened to that belief
  let elders = [];

  for (let g = 0; g < p.generations; g++) {
    const epoch = epochOf(p, g);
    const chem = chems[epoch];
    // The whole catalogue exists (so a rule can be asked about any of it);
    // only the map's species are met.
    registerSpecies(catalogue.map((t) => speciesUnder(chem, t)));
    const map = drawMap(p, chem, catalogue, worldRnd);

    const ants = withRng(lifeRnd, () => Array.from({ length: p.colony }, (_, i) => {
      const f = Object.assign(createFagi(), { id: g * 1000 + i + 1, sister: true, stats: newStats() });
      applyGenome(f, createGenome());
      return f;
    }));
    let taught = 0;
    for (const f of ants) {
      if (g === 0) seedTheory(f, theoryOf(chem, p.theory, worldRnd));
      else if (elders.length) {
        const elder = pick(elders, elders.map(fitness), lifeRnd);
        taught += withRng(lifeRnd, () => teach(f, elder));
      }
    }
    const birth = ants.map((f) => accuracy(f, chem, catalogue).balanced);
    const birthFalse = ants.map((f) => falseRules(f, chem, catalogue));

    let told = 0;
    withRng(lifeRnd, () => {
      for (let t = 0; t < p.life && ants.some((f) => f.alive); t += p.dt) {
        for (const f of ants) if (f.alive) live(p, f, ants, map, chem, lifeRnd);
        if (Math.floor((t + p.dt) / p.meetEvery) > Math.floor(t / p.meetEvery) && SOCIAL.share) {
          told += meet(ants, lifeRnd, g, genealogy);
        }
      }
    });

    const end = ants.map((f) => falseRules(f, chem, catalogue));
    noteGenealogy(genealogy, ants, g, chem, catalogue);
    const sum = (k) => ants.reduce((a, f) => a + f.stats[k], 0);
    rows.push({
      g, epoch,
      alive: ants.filter((f) => f.alive).length,
      ants: p.colony,
      life: round(mean(ants.map((f) => f.age)), 1),
      encounters: sum('encounters'),
      bites: sum('bites'),
      harmful: sum('harmful'),
      foodSkipped: sum('foodSkipped'),
      poisonSkipped: sum('poisonSkipped'),
      firstHarmful: ants.reduce((a, f) => a + f.stats.poisonKinds.size, 0),
      accBirth: round(mean(birth)),
      accEnd: round(mean(ants.map((f) => accuracy(f, chem, catalogue).balanced))),
      falseBirth: birthFalse.reduce((a, x) => a + x.false, 0),
      mythsBirth: birthFalse.reduce((a, x) => a + x.myths, 0),
      falseEnd: end.reduce((a, x) => a + x.false, 0),
      mythsEnd: end.reduce((a, x) => a + x.myths, 0),
      rulesEnd: end.reduce((a, x) => a + x.held, 0),
      taught,
      told,
    });
    elders = ants.filter((f) => f.alive);
  }
  registerSpecies([]);
  return { rows, genealogy: [...genealogy.values()] };
}

function newStats() {
  return { encounters: 0, bites: 0, harmful: 0, foodSkipped: 0, poisonSkipped: 0, poisonKinds: new Set() };
}

// One step of one ant's life.
function live(p, f, ants, map, chem, rnd) {
  f.age += p.dt;
  updateEffects(f, p.dt);
  resolveEpisodes(f, p.dt);
  decayMemory(f.brain, p.dt);
  refreshRules(f.brain);
  f.hunger += HUNGER.rate * statMult(f, 'hungerRate') * p.dt;

  if (rnd() < p.encounter * p.dt) {
    // She comes upon `choices` fruit at once and eats the one she wants most,
    // if any. With one, refusing it means waiting for the next; with several,
    // refusing one costs little.
    const options = Array.from({ length: p.choices }, () => {
      const traits = map[Math.floor(rnd() * map.length)];
      return { traits, key: speciesKey(traits), truth: feedOf(chem, traits) };
    });
    // Only a meeting while hungry is a choice: sated, nobody eats anything.
    const hungry = f.hunger >= CARRY.eatBelow;
    if (hungry) f.stats.encounters += 1;
    let best = null;
    let bestScore = -Infinity;
    for (const o of options) {
      const score = scoreOf(p, f, o.key, o.traits, o.truth);
      if (score !== null && score > bestScore) { best = o; bestScore = score; }
    }
    if (best) {
      const { traits, key, truth } = best;
      // A noisy bite does what a fruit of another class would.
      let cls = truth;
      if (p.noise > 0 && rnd() < p.noise) {
        const others = CLASSES.filter((c) => c !== truth);
        cls = others[Math.floor(rnd() * others.length)];
      }
      eat(f, key, { hunger: FEED[cls] });
      learns(p, f, traits, cls);
      f.stats.bites += 1;
      if (truth === 'poison') { f.stats.harmful += 1; f.stats.poisonKinds.add(key); }
      // Sisters who happen to see it learn a little.
      for (const b of ants) {
        if (b !== f && b.alive && rnd() < p.observe) learnSeen(b.brain, key, f.lastMeal.reward ?? 0, b.age, f.id);
      }
    } else if (hungry && options.every((o) => o.truth === 'poison')) f.stats.poisonSkipped += 1;
    else if (hungry) f.stats.foodSkipped += 1;
  }

  observeHabits(f, NO_PANTRY);
  if (resolveVitalFailure(f)) deathLesson(f, f.cause, NO_PANTRY);
}

// Every living ant tells one random living sister what she knows.
function meet(ants, rnd, g, genealogy) {
  const alive = ants.filter((f) => f.alive);
  let n = 0;
  for (const a of alive) {
    const others = alive.filter((b) => b !== a);
    if (!others.length) break;
    const b = others[Math.floor(rnd() * others.length)];
    for (const item of pass(a, b, b.age, { kind: 'told', scale: SOCIAL.trust, budget: SOCIAL.budget })) {
      n += 1;
      if (item.kind === 'bite') continue;
      const e = entry(genealogy, item.origin, g);
      e.told += 1;
    }
  }
  return n;
}

function entry(genealogy, origin, g) {
  let e = genealogy.get(origin);
  if (!e) {
    e = { origin, seeded: origin.startsWith('seed/'), bornG: g, lastG: g, told: 0, gens: 0, falseGens: 0, maxCarriers: 0 };
    genealogy.set(origin, e);
  }
  return e;
}

// At the end of a generation: who carries each belief that was ever passed
// on, and whether it is false now. Beliefs never passed on are not followed.
function noteGenealogy(genealogy, ants, g, chem, catalogue) {
  const carriers = new Map();
  for (const f of ants) {
    for (const r of f.brain.rules.list) {
      if (r.retired || !r.origin) continue;
      const c = carriers.get(r.origin) ?? { n: 0, false: false };
      c.n += 1;
      c.false ||= Boolean(ruleIsFalse(r, chem, catalogue));
      carriers.set(r.origin, c);
    }
  }
  for (const [origin, c] of carriers) {
    const e = entry(genealogy, origin, g);
    e.lastG = g;
    e.gens += 1;
    if (c.false) e.falseGens += 1;
    e.maxCarriers = Math.max(e.maxCarriers, c.n);
  }
}
