// A population that breeds inside the world (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §10).
//
// Once per step, after everyone moved (colony.js):
//
//   mating    in the nest, an adult female and an adult male who both can
//             (§10.1): strength and needs in order, no thermal stress, rested
//             since the last time, and a pantry she believes holds enough to
//             raise a brood. She picks, among the males who can, the one who
//             looks best (§10.2: how well he is doing, which anyone can see),
//             never a close relative (LIFE.kinLimit). Both pay energy; she
//             pays the egg on top (§10.4).
//   the egg   is conceived there: a genome recombined from both (generations.js)
//             and a sex, drawn at conception (§9.3). It lies in the nest and
//             develops with the nest's warmth; when it is ready it needs a
//             ration from the pantry to hatch, and if none comes it dies.
//   hatching  a juvenile, born knowing nothing but her genes, raised by her
//             mother's culture if the mother is alive (generations.js teach).
//             Memories are not inherited: only the genome and what is taught.
//
// Nobody is created by a runner: every generation after the founders comes
// from here, and extinction is a result, not an error. Kinship is recorded
// (world.lineage) and so is how inbred each egg is.
//
// Nothing here runs with LIFE off.

import { LIFE, HUNGER, THIRST, THERMAL, CYCLE, GEN } from './config.js';
import { nestOf, takeFromNest, record } from './world.js';
import { nestUnder } from './nest.js';
import { createFagi } from './fagi.js';
import { assignSex, energyMax } from './biology.js';
import { createGenome, recombine, applyGenome, teach } from './generations.js';
import { drawLifespan, lifeAge, fertility } from './lifecycle.js';
import { cycleAt } from './cycle.js';
import { nestWarmth } from './things.js';
import { edibleCount } from './learned/rules.js';

const r2 = (v) => Math.round(v * 100) / 100;

// How well she looks, 0-1: what anyone watching her can see.
export function looksWell(f) {
  const need = Math.max(f.hunger / HUNGER.max, f.thirst / THIRST.max);
  return Math.max(0, Math.min(1, (1 - need) * 0.6 + (f.energy / energyMax(f)) * 0.4));
}

// The founders: grown, with a lifespan each, and the start of the lineage.
export function foundPopulation(world, colony) {
  if (!LIFE.enabled) return;
  world.lineage ??= {};
  colony.nextId = colony.ants.length + 1;
  colony.life = { matings: 0, laid: 0, hatched: 0, eggsLost: {}, deaths: {}, generations: 0, peak: colony.ants.length, extinctAt: null };
  for (const f of colony.ants) {
    f.startAge = LIFE.adultAt;
    f.lifespan = drawLifespan();
    f.generation = 0;
    f.genome ??= createGenome();
    world.lineage[f.id] = { mother: null, father: null, bornAt: 0, generation: 0, sex: f.sex };
  }
}

// Coancestry of two individuals from the pedigree (world.lineage), the
// classic recursive definition. Relatedness is twice it.
function coancestry(lineage, a, b, memo = new Map(), depth = 0) {
  if (a == null || b == null || depth > 8) return 0;
  const key = a < b ? `${a}|${b}` : `${b}|${a}`;
  if (memo.has(key)) return memo.get(key);
  let f;
  if (a === b) {
    const la = lineage[a];
    f = 0.5 * (1 + (la ? coancestry(lineage, la.mother, la.father, memo, depth + 1) : 0));
  } else {
    // Walk up from the younger one.
    const [young, other] = (lineage[a]?.bornAt ?? 0) >= (lineage[b]?.bornAt ?? 0) ? [a, b] : [b, a];
    const ly = lineage[young];
    f = ly && (ly.mother != null || ly.father != null)
      ? 0.5 * (coancestry(lineage, ly.mother, other, memo, depth + 1) + coancestry(lineage, ly.father, other, memo, depth + 1))
      : 0;
  }
  memo.set(key, f);
  return f;
}

export const relatedness = (lineage, a, b) => 2 * coancestry(lineage ?? {}, a, b);

// How much a crowded nest slows every brood (LIFE.gradual): 1 while it is
// less than a quarter full, growing as it fills, as a crowd competes for food
// and room long before the nest cannot hold one more.
export function crowding(n) {
  if (!LIFE.gradual) return 1;
  const over = Math.max(0, n / LIFE.maxPopulation - 0.25) / 0.75;
  return 1 / Math.max(0.05, 1 - over ** 2);
}

// Seconds after mating before she may again: her sex's recovery, longer as her
// fertility fades and as the nest fills.
function recovery(f, crowd) {
  const base = f.sex === 'female' ? LIFE.femaleRecover : LIFE.maleRecover;
  return base * crowd / Math.max(0.01, fertility(f));
}

// Can she breed right now (§10.1)? `nest` is the nest object.
function ready(f, world, nest, crowd = 1) {
  if (!f.alive || f.swimming || !f.sex) return false;
  if (LIFE.gradual ? fertility(f) <= 0 : f.lifeStage !== 'adult') return false;
  if (nestUnder(f, world) !== nest) return false;
  if (LIFE.gradual) {
    if (f.lastMatedAt != null && f.age < f.lastMatedAt + recovery(f, crowd)) return false;
    // Her first brood waits too, the more the fuller the nest (nothing if it is empty).
    if (f.lastMatedAt == null && f.age < (f.stageAt ?? 0) + recovery(f, crowd) - recovery(f, 1)) return false;
  } else if (f.age < (f.nextMateAt ?? 0)) return false;
  if (f.energy < LIFE.mateEnergy * energyMax(f)) return false;
  if (f.hunger / HUNGER.max >= LIFE.mateNeed || f.thirst / THIRST.max >= LIFE.mateNeed) return false;
  if (THERMAL.enabled && (f.thermalStress ?? 0) > 0.25 * THERMAL.maxStress) return false;
  return true;
}

function nestTemperature(world) {
  if (!THERMAL.enabled || !CYCLE.enabled) return null;
  const sky = cycleAt(world.time);
  return THERMAL.nestBuffer * (THERMAL.nestTemp + nestWarmth(world)) + (1 - THERMAL.nestBuffer) * sky.ambient;
}

// How fast an egg develops at this nest temperature: 0 in the cold, 1 warm.
export function eggPace(temp) {
  if (temp == null) return 1;
  return Math.max(0, Math.min(1, (temp - LIFE.eggCold) / (LIFE.eggWarm - LIFE.eggCold)));
}

function living(colony) {
  return colony.ants.filter((f) => f.alive).length;
}

function mate(world, colony, nest, mother, father) {
  const lineage = world.lineage;
  const inbreeding = coancestry(lineage, mother.id, father.id);
  mother.energy -= LIFE.mateCost;
  father.energy -= LIFE.mateCost;
  mother.hunger = Math.min(HUNGER.max, mother.hunger + LIFE.eggCost);
  mother.nextMateAt = mother.age + LIFE.femaleRecover;
  father.nextMateAt = father.age + LIFE.maleRecover;
  mother.lastMatedAt = mother.age;
  father.lastMatedAt = father.age;
  const tag = (f) => `${f.id}`;
  const egg = {
    id: colony.nextEgg = (colony.nextEgg ?? 0) + 1,
    mother: mother.id, father: father.id,
    genome: recombine(mother.genome ?? createGenome(), father.genome ?? createGenome(), Math.random, [tag(mother), tag(father)]),
    sex: assignSex(),
    generation: Math.max(mother.generation ?? 0, father.generation ?? 0) + 1,
    inbreeding: r2(inbreeding),
    laidAt: world.time, progress: 0, readyAt: null,
  };
  (nest.eggs ??= []).push(egg);
  colony.life.matings += 1;
  colony.life.laid += 1;
  for (const f of [mother, father]) f.lastMate = { n: (f.lastMate?.n ?? 0) + 1, with: f === mother ? father.id : mother.id, egg: egg.id };
  record(world, 'egg', { id: egg.id, mother: mother.id, father: father.id, inbreeding: egg.inbreeding });
}

function matings(world, colony, nest) {
  const alive = living(colony) + (nest.eggs?.length ?? 0);
  if (alive >= LIFE.maxPopulation) return;
  const crowd = crowding(alive);
  const females = colony.ants.filter((f) => f.sex === 'female' && ready(f, world, nest, crowd) && edibleCount(f, f.pantry) >= LIFE.mateStock);
  if (!females.length) return;
  const males = colony.ants.filter((f) => f.sex === 'male' && ready(f, world, nest, crowd));
  for (const mother of females) {
    const options = males.filter((m) => relatedness(world.lineage, mother.id, m.id) < LIFE.kinLimit && ready(m, world, nest, crowd));
    if (!options.length) continue;
    const father = options.reduce((best, m) => (looksWell(m) > looksWell(best) || (looksWell(m) === looksWell(best) && m.id < best.id) ? m : best));
    mate(world, colony, nest, mother, father);
    if (living(colony) + nest.eggs.length >= LIFE.maxPopulation) return;
  }
}

function hatch(world, colony, nest, egg) {
  const mother = colony.ants.find((f) => f.id === egg.mother);
  const child = createFagi({ sex: egg.sex, genome: egg.genome });
  applyGenome(child, egg.genome);
  child.x = nest.x;
  child.y = nest.y;
  child.id = colony.nextId++;
  child.sister = true;
  child.startAge = 0;
  child.lifespan = drawLifespan();
  child.generation = egg.generation;
  child.lifeStage = 'juvenile';
  if (GEN.culture && mother?.alive) teach(child, mother);
  colony.ants.push(child);
  world.lineage[child.id] = { mother: egg.mother, father: egg.father, bornAt: world.time, generation: egg.generation, sex: egg.sex, inbreeding: egg.inbreeding };
  colony.life.hatched += 1;
  colony.life.generations = Math.max(colony.life.generations, egg.generation);
  colony.life.peak = Math.max(colony.life.peak, living(colony));
  if (mother) mother.lastBrood = { n: (mother.lastBrood?.n ?? 0) + 1, child: child.id };
  record(world, 'hatch', { id: child.id, egg: egg.id, sex: egg.sex ?? null, generation: egg.generation });
  return child;
}

function lose(world, colony, nest, egg, reason) {
  nest.eggs.splice(nest.eggs.indexOf(egg), 1);
  colony.life.eggsLost[reason] = (colony.life.eggsLost[reason] ?? 0) + 1;
  record(world, 'egg_lost', { id: egg.id, reason });
}

function incubate(world, colony, nest, dt) {
  const pace = eggPace(nestTemperature(world));
  for (const egg of [...(nest.eggs ?? [])]) {
    if (egg.progress < 1) {
      egg.progress = Math.min(1, egg.progress + (pace * dt) / LIFE.incubation);
      if (egg.progress >= 1) egg.readyAt = world.time;
      continue;
    }
    // Ready: it hatches on a ration from the pantry, whatever is stored.
    const type = Object.keys(nest.stock ?? {}).filter((k) => nest.stock[k] > 0).sort((a, b) => nest.stock[b] - nest.stock[a])[0];
    if (type && takeFromNest(nest, type)) {
      record(world, 'nest_take', { what: type });
      nest.eggs.splice(nest.eggs.indexOf(egg), 1);
      hatch(world, colony, nest, egg);
    } else if (world.time - egg.readyAt >= LIFE.eggStarve) {
      lose(world, colony, nest, egg, 'starved');
    }
  }
}

// Once per step, for the whole colony.
export function updateLife(world, colony, dt) {
  if (!LIFE.enabled) return;
  if (!colony.life) foundPopulation(world, colony);
  const nest = nestOf(world);
  if (!nest) return;
  for (const f of colony.ants) {
    if (!f.alive && !f.counted) {
      f.counted = true;
      colony.life.deaths[f.cause || 'unknown'] = (colony.life.deaths[f.cause || 'unknown'] ?? 0) + 1;
    }
  }
  incubate(world, colony, nest, dt);
  matings(world, colony, nest);
  if (!colony.life.extinctAt && !living(colony) && !(nest.eggs?.length)) {
    colony.life.extinctAt = world.time;
    record(world, 'extinct', { at: world.time });
  }
}

// A snapshot for reports and the HUD.
export function census(world, colony) {
  const alive = colony.ants.filter((f) => f.alive);
  const nest = nestOf(world);
  return {
    alive: alive.length,
    eggs: nest?.eggs?.length ?? 0,
    stages: alive.reduce((a, f) => ({ ...a, [f.lifeStage]: (a[f.lifeStage] ?? 0) + 1 }), {}),
    females: alive.filter((f) => f.sex === 'female').length,
    males: alive.filter((f) => f.sex === 'male').length,
    oldest: alive.length ? Math.round(Math.max(...alive.map(lifeAge))) : 0,
    ...colony.life,
  };
}
