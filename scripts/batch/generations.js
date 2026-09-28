// Generations (--generations G): lineages of colonies, one after another.
//
// A lineage is G generations. Each generation is a colony of --colony ants on
// a map of its own (a new layout every generation, like a new season), with
// the lineage's chemistry. Halfway (--switch-at) the chemistry turns upside
// down (chemistry.js invertChemistry): the smell that poisoned now feeds and
// the other way round. The question is what adapts first:
//   - culture (GEN.culture): newborns are raised by a surviving elder;
//   - genes (GEN.genes): newborns carry innate biases from parents chosen by
//     how well they did, mutated a little.
// Both, either or neither: --set GEN.culture=0, --set GEN.genes=0.
//
// With GEN.sexual (needs SEX, e.g. --organism) every newborn has a mother and a
// father, each picked by fitness among her sex, and her genome recombines
// theirs (generations.js recombine). A generation left without one sex ends
// the lineage: extinction is a result, not an error.

import { createWorld } from '../../src/world.js';
import { generateMap } from '../../src/mapgen.js';
import { stepWorld } from '../../src/simulation.js';
import { createColony, updateColony } from '../../src/colony.js';
import { createChemistry, invertChemistry, speciesKeys } from '../../src/chemistry.js';
import { createGenome, mutate, recombine, diversity, applyGenome, teach, pick, fitness } from '../../src/generations.js';
import { rng, withRng } from './random.js';
import { POINT_TYPES, GEN, SEX } from '../../src/config.js';
import { accuracy } from '../../research/lab/truth.js';
import { round, mean } from './stats.js';
import { noteLearning, learningSummary, createMythLog, noteMyths, mythSummary, isFalse } from './run.js';

const MYTH_EVERY = 10;

const poisonSmell = (chem) => Object.keys(chem.smell).find((s) => chem.smell[s] === 'poison');
const foodSmell = (chem) => Object.keys(chem.smell).find((s) => chem.smell[s] === 'nourishing');

// One lineage: returns one summary per generation.
export function runLineage(opts, seed) {
  const chemA = withRng(rng(seed * 31 + 7), () => createChemistry());
  const chemB = invertChemistry(chemA);
  const switchAt = opts.switchAt ?? Math.floor(opts.generations / 2);
  const geneRng = rng(seed * 7 + 1);
  const fagiRng = rng(seed);
  const n = Math.max(2, opts.colony);

  if (GEN.sexual && !SEX.enabled) throw new Error('GEN.sexual needs SEX.enabled (--organism turns it on)');
  let genomes = Array.from({ length: n }, () => createGenome());
  let elders = [];
  let matings = null;   // sexual only: how the generation about to be born was conceived
  const out = [];

  for (let g = 0; g < opts.generations; g++) {
    const chem = g < switchAt ? chemA : chemB;
    const mapRng = rng(seed * 1000 + g * 17 + opts.mapSeed);
    const worldRng = rng(seed * 7919 + g);
    const world = withRng(mapRng, () => { const w = createWorld(); generateMap(w, { chemistry: chem }); return w; });
    const colony = withRng(fagiRng, () => createColony(n));
    let taught = 0;
    colony.ants.forEach((f, i) => {
      applyGenome(f, genomes[i]);
      if (elders.length) taught += teach(f, withRng(geneRng, () => pick(elders, elders.map(fitness))));
    });
    // What each newborn believes about the two smells that matter, at birth.
    const born = birthView(colony, chem);

    const logs = colony.ants.map(() => ({ bites: [], met: {}, eaten: 0, stances: {}, opinions: [] }));
    const myths = createMythLog();
    const steps = Math.ceil(opts.duration / opts.dt);
    for (let i = 0; i < steps && colony.ants.some((f) => f.alive); i++) {
      withRng(worldRng, () => stepWorld(world, opts.dt));
      withRng(fagiRng, () => updateColony(world, colony, opts.dt));
      colony.ants.forEach((f, k) => { if (f.alive) noteLearning(logs[k], f); });
      if (i % Math.round(MYTH_EVERY / opts.dt) === 0) noteMyths(myths, colony, world.time);
    }
    noteMyths(myths, colony, world.time);

    const learning = colony.ants.map((f, k) => learningSummary(logs[k], f));
    out.push({
      g, chem: g < switchAt ? 'A' : 'B',
      alive: colony.ants.filter((f) => f.alive).length, ants: n,
      lived: round(mean(colony.ants.map((f) => f.age))),
      bites: learning.reduce((a, l) => a + l.bites, 0),
      harmfulBites: learning.reduce((a, l) => a + l.harmfulBites, 0),
      firstHarmful: learning.reduce((a, l) => a + l.harmfulFirstBites, 0),
      taught,
      born,
      falseUnlived: learning.reduce((a, l) => a + l.falseUnlived, 0),
      falseLived: learning.reduce((a, l) => a + l.falseLived, 0),
      myths: mythSummary(myths, world.time),
      // Rules held at the end that are false on this map, by id (the old
      // chemistry's rules turn false after the switch).
      falseRules: falseRuleIds(colony),
      ...(GEN.sexual ? { population: population(colony, genomes, matings) } : {}),
    });

    // The next generation. Genes: parents by fitness, children mutated.
    // Culture: raised by those still alive; if nobody is, what they knew dies.
    elders = colony.ants.filter((f) => f.alive);
    if (GEN.sexual) {
      const next = conceive(colony, g, geneRng);
      if (!next) { out.at(-1).population.extinct = true; break; }
      ({ genomes, matings } = next);
      continue;
    }
    const weights = colony.ants.map(fitness);
    genomes = colony.ants.map(() => {
      const parent = withRng(geneRng, () => pick(colony.ants, weights));
      return mutate(parent.genome ?? createGenome(), geneRng);
    });
  }
  return out;
}

// The next generation's genomes, from mothers and fathers of this one, each
// picked by fitness among her sex. null when a sex is missing.
function conceive(colony, g, geneRng) {
  const females = colony.ants.filter((f) => f.sex === 'female');
  const males = colony.ants.filter((f) => f.sex === 'male');
  if (!females.length || !males.length) return null;
  const tag = (f) => `${g}.${f.id}`;
  let siblings = 0;
  const genomes = colony.ants.map(() => {
    const mother = withRng(geneRng, () => pick(females, females.map(fitness)));
    const father = withRng(geneRng, () => pick(males, males.map(fitness)));
    const mp = mother.genome?.parents ?? [];
    if (mp.length && mp.some((p) => father.genome?.parents?.includes(p))) siblings++;
    return recombine(mother.genome ?? createGenome(), father.genome ?? createGenome(), geneRng, [tag(mother), tag(father)]);
  });
  return { genomes, matings: { siblings, n: genomes.length } };
}

// Sexual lineages: sex ratio, genetic diversity, kinship and the body genes.
function population(colony, genomes, matings) {
  const females = colony.ants.filter((f) => f.sex === 'female').length;
  const bodyMean = (k) => round(mean(genomes.map((gn) => gn.body?.[k] ?? 1)), 3);
  return {
    females, males: colony.ants.length - females,
    diversity: diversity(genomes),
    parents: genomes.map((gn) => gn.parents ?? null),
    siblingMatings: matings?.siblings ?? 0,
    body: { speed: bodyMean('speed'), metabolism: bodyMean('metabolism'), insulation: bodyMean('insulation'), energyMax: bodyMean('energyMax') },
    bySex: {
      female: round(mean(colony.ants.filter((f) => f.sex === 'female').map((f) => f.age))),
      male: round(mean(colony.ants.filter((f) => f.sex === 'male').map((f) => f.age))),
    },
  };
}

// At birth, on average: the innate bias toward the poison and the food smells
// of this generation's chemistry, and how many newborns were taught to avoid
// the poison smell, or to avoid the food smell (the old poison, after a switch).
//
// Also, measured as in the lab (research/lab/truth.js): how right what she was
// taught is over the map's species (balanced accuracy), how many rules she
// was born with, and how many of them are about traits.
function birthView(colony, chem) {
  const poison = `smell:${poisonSmell(chem)}`;
  const food = `smell:${foodSmell(chem)}`;
  const avoids = (f, cue) => f.brain.rules.list.some((r) => !r.retired && r.verdict === 'avoid' && r.when.all?.includes(cue));
  const species = speciesKeys().map((k) => POINT_TYPES[k].traits);
  const live = (f) => f.brain.rules.list.filter((r) => !r.retired);
  return {
    acc: round(mean(colony.ants.map((f) => accuracy(f, chem, species).balanced)), 3),
    rules: round(mean(colony.ants.map((f) => live(f).length)), 2),
    traitRules: round(mean(colony.ants.map((f) => live(f).filter((r) => r.when.all).length)), 2),
    innatePoison: round(mean(colony.ants.map((f) => f.brain.cues[poison]?.innate ? f.brain.cues[poison].w : 0)), 2),
    innateFood: round(mean(colony.ants.map((f) => f.brain.cues[food]?.innate ? f.brain.cues[food].w : 0)), 2),
    taughtAvoidPoison: colony.ants.filter((f) => avoids(f, poison)).length,
    taughtAvoidFood: colony.ants.filter((f) => avoids(f, food)).length,
  };
}

function falseRuleIds(colony) {
  const ids = {};
  for (const f of colony.ants) {
    for (const r of f.brain.rules.list) if (!r.retired && isFalse(r)) ids[r.id] = (ids[r.id] ?? 0) + 1;
  }
  return ids;
}

// The report: one line per generation, averaged over every lineage.
export function reportGenerations(opts, lineages) {
  const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '-');
  const G = opts.generations;
  const L = [`generations: ${lineages.length} lineages × ${G} generations × ${opts.colony} ants × ${opts.duration}s; the chemistry turns over at generation ${opts.switchAt ?? Math.floor(G / 2)}`];
  L.push('gen chem  alive   1st harmful/ant  harmful   born wary of poison · of food   taught avoid poison · food   false rules held (unlived · lived)   taught: accuracy · rules · trait rules');
  for (let g = 0; g < G; g++) {
    const rows = lineages.map((l) => l[g]).filter(Boolean);
    if (!rows.length) { L.push(`${String(g).padStart(3)}  every lineage extinct`); continue; }
    const sum = (f) => rows.reduce((a, r) => a + f(r), 0);
    const ants = sum((r) => r.ants);
    L.push([
      String(g).padStart(3), ` ${rows[0].chem}  `,
      pct(sum((r) => r.alive), ants).padStart(6),
      String(round(sum((r) => r.firstHarmful) / ants, 2)).padStart(12),
      pct(sum((r) => r.harmfulBites), sum((r) => r.bites)).padStart(12),
      `${round(mean(rows.map((r) => r.born.innatePoison)), 2)} · ${round(mean(rows.map((r) => r.born.innateFood)), 2)}`.padStart(18),
      `${pct(sum((r) => r.born.taughtAvoidPoison), ants)} · ${pct(sum((r) => r.born.taughtAvoidFood), ants)}`.padStart(24),
      `${sum((r) => r.falseUnlived)} · ${sum((r) => r.falseLived)}`.padStart(22),
      `${round(mean(rows.map((r) => r.born.acc)), 2)} · ${round(mean(rows.map((r) => r.born.rules)), 1)} · ${round(mean(rows.map((r) => r.born.traitRules)), 1)}`.padStart(26),
    ].join(''));
  }
  if (lineages.some((l) => l[0]?.population)) L.push('', ...reportPopulation(lineages, G));
  return L.join('\n');
}

// Sexual lineages only.
function reportPopulation(lineages, G) {
  const L = ['gen  lineages  ♀:♂      diversity  sibling matings  body speed · metabolism · insulation   lived ♀ · ♂'];
  for (let g = 0; g < G; g++) {
    const rows = lineages.map((l) => l[g]?.population).filter(Boolean);
    if (!rows.length) continue;
    const m = (f) => round(mean(rows.map(f).filter((x) => Number.isFinite(x))), 3);
    L.push([
      String(g).padStart(3), String(rows.length).padStart(8),
      `${m((p) => p.females)}:${m((p) => p.males)}`.padStart(12),
      String(m((p) => p.diversity)).padStart(11),
      String(m((p) => p.siblingMatings)).padStart(17),
      `${m((p) => p.body.speed)} · ${m((p) => p.body.metabolism)} · ${m((p) => p.body.insulation)}`.padStart(35),
      `${m((p) => p.bySex.female)} · ${m((p) => p.bySex.male)}`.padStart(18),
    ].join(' '));
  }
  const extinct = lineages.filter((l) => l.at(-1)?.population?.extinct).length;
  L.push(`extinct lineages: ${extinct}/${lineages.length}`);
  return L;
}

