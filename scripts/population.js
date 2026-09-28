// A population on its own (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §10, phase 5).
//
// LIFE.founders adults on a map, the whole organism on, and nothing else:
// no runner makes the next generation. Every newborn comes from a mating in
// the nest (reproduction.js). Reported per map, and on average:
//
//   the population over time (alive, eggs), births and deaths by cause, how
//   many generations it reached, whether and when it died out, the sex ratio,
//   the genetic diversity of the living (generations.js diversity), how
//   inbred the eggs were, and how the living judge fruit they never tasted
//   (rules plus aversion, over the whole catalogue: would she eat it?).
//
//   node scripts/population.js [--maps 8] [--duration 10800] [--seed 5000]
//                              [--species 6] [--every 900] [--set BLOCK.key=V ...]

import { createWorld, nestOf } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { stepWorld } from '../src/simulation.js';
import { createColony, updateColony } from '../src/colony.js';
import { enableOrganism } from '../src/organism.js';
import * as CONFIG from '../src/config.js';
import { census } from '../src/reproduction.js';
import { diversity } from '../src/generations.js';
import { TRAITS, speciesKey, cuesOfTraits, feedOf } from '../src/chemistry.js';
import { verdict } from '../src/learned/rules.js';
import { aversive } from '../src/appetite.js';
import { rng, withRng } from './batch/random.js';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
enableOrganism();
CONFIG.MAPGEN.species = opt('species', 6);
for (let i = 0; i < args.length; i++) {
  if (args[i] !== '--set') continue;
  const [path, value] = args[i + 1].split('=');
  const [block, key] = path.split('.');
  CONFIG[block][key] = Number.isFinite(Number(value)) ? Number(value) : value;
}
const MAPS = opt('maps', 8);
const DURATION = opt('duration', 10800);
const SEED = opt('seed', 5000);
const EVERY = opt('every', 900);
const DT = 0.05;
const { LIFE } = CONFIG;

const catalogue = [];
for (const color of TRAITS.color) for (const shape of TRAITS.shape) for (const smell of TRAITS.smell) catalogue.push({ color, shape, smell });

// Would she eat it? Balanced over poison and the rest, the whole catalogue.
function judgment(f, chem) {
  let hit = 0; let miss = 0; let fa = 0; let ok = 0;
  for (const t of catalogue) {
    const key = speciesKey(t);
    const avoids = verdict(f, 'pursue', key, { traits: cuesOfTraits(t) }) === 'avoid' || aversive(f, key, cuesOfTraits(t));
    if (feedOf(chem, t) === 'poison') { if (avoids) hit++; else miss++; } else if (avoids) fa++; else ok++;
  }
  return ((hit + miss ? hit / (hit + miss) : 1) + (fa + ok ? ok / (fa + ok) : 1)) / 2;
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const r2 = (v) => Math.round(v * 100) / 100;

function run(i) {
  const seed = SEED + i;
  const world = withRng(rng(1 + i * 13), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(seed * 7919);
  const antRng = rng(seed);
  const colony = withRng(antRng, () => createColony(LIFE.founders));
  const nest = nestOf(world);
  for (const f of colony.ants) { f.x = nest.x; f.y = nest.y; }
  world.colony = colony;
  const curve = [];
  const steps = Math.ceil(DURATION / DT);
  for (let s = 0; s <= steps; s++) {
    withRng(worldRng, () => stepWorld(world, DT));
    withRng(antRng, () => updateColony(world, colony, DT));
    if (s % Math.round(EVERY / DT) === 0) {
      const c = census(world, colony);
      curve.push({ t: Math.round(world.time), alive: c.alive, eggs: c.eggs });
    }
    if (colony.life?.extinctAt != null) break;
  }
  const c = census(world, colony);
  const living = colony.ants.filter((f) => f.alive);
  const inbred = Object.values(world.lineage ?? {}).filter((l) => l.inbreeding != null).map((l) => l.inbreeding);
  const byGen = {};
  const byStage = {};
  for (const f of living) {
    const j = judgment(f, world.chemistry);
    (byGen[f.generation] ??= []).push(j);
    (byStage[f.lifeStage] ??= []).push(j);
  }
  return {
    seed, curve, census: c,
    diversity: living.length > 1 ? diversity(living.map((f) => f.genome)) : null,
    inbreeding: r2(mean(inbred)),
    inbredEggs: inbred.filter((v) => v > 0).length,
    judgment: Object.fromEntries(Object.entries(byGen).map(([g, xs]) => [g, r2(mean(xs))])),
    byStage: Object.fromEntries(Object.entries(byStage).map(([g, xs]) => [g, r2(mean(xs))])),
  };
}

const runs = [];
for (let i = 0; i < MAPS; i++) {
  process.stderr.write(`map ${i + 1}/${MAPS}\r`);
  runs.push(run(i));
}
process.stderr.write(' '.repeat(20) + '\r');

console.log(`population: ${MAPS} maps × ${DURATION}s, ${LIFE.founders} founders, ${CONFIG.MAPGEN.species} species, the whole organism`);
for (const r of runs) {
  const c = r.census;
  const deaths = Object.entries(c.deaths).map(([k, n]) => `${k} ${n}`).join(' · ') || '-';
  const lost = Object.entries(c.eggsLost).map(([k, n]) => `${k} ${n}`).join(' · ') || '-';
  console.log(`  seed ${r.seed}: ${c.extinctAt != null ? `extinct at ${Math.round(c.extinctAt)}s` : `alive ${c.alive} (${c.females}♀ ${c.males}♂), eggs ${c.eggs}`} · generations ${c.generations} · peak ${c.peak} · matings ${c.matings} · hatched ${c.hatched} · eggs lost ${lost} · died: ${deaths}`);
  console.log(`      over time: ${r.curve.map((p) => `${p.t}s ${p.alive}+${p.eggs}`).join('  ')}`);
  console.log(`      diversity ${r.diversity ?? '-'} · egg inbreeding ${r.inbreeding} (${r.inbredEggs} inbred) · would she eat it, by generation: ${Object.entries(r.judgment).map(([g, v]) => `g${g} ${v}`).join(' ') || '-'}; by stage: ${Object.entries(r.byStage).map(([g, v]) => `${g} ${v}`).join(' ') || '-'}`);
}
const ext = runs.filter((r) => r.census.extinctAt != null);
console.log(`  extinct ${ext.length}/${MAPS}${ext.length ? ` (at ${ext.map((r) => Math.round(r.census.extinctAt)).join(', ')}s)` : ''} · generations reached ${runs.map((r) => r.census.generations).join(', ')} · hatched per map ${r2(mean(runs.map((r) => r.census.hatched)))}`);
