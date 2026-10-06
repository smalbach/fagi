#!/usr/bin/env node
// Calibrating a world where what she does decides how she fares.
//
// For one fruit interval (TREE.interval), lives on varied maps under her born
// program and under programs broken on purpose (a few born lines moved to the
// end). A world is useful for testing learning when:
//   - her born program survives about half the time (room to do better and
//     worse), and
//   - breaking her program costs her survival (behavior matters there).
// In the default world (interval 8) every program survives: nothing she
// learns can show.
//
//   node scripts/calibrate-world.js --interval 600 [--runs 24] [--secs 7200] [--seed 1000] [--map 1] [--set K=V]... [--only born,learns] [--json]

import * as CONFIG from '../src/config.js';
import { enableOrganism } from '../src/organism.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import { programOf } from '../src/program.js';
import { rng, withRng } from './batch/random.js';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const INTERVAL = Number(arg('interval', 600));
const RUNS = Number(arg('runs', 24));
const SECS = Number(arg('secs', 7200));
const MAPS = arg('map', 'varied');
const SEED0 = Number(arg('seed', 1000));
const DT = 0.05;

enableOrganism();
CONFIG.TREE.interval = INTERVAL;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] !== '--set') continue;
  const [path, v] = argv[i + 1].split('=');
  const [group, key] = path.split('.');
  CONFIG[group][key] = Number.isNaN(Number(v)) ? v : Number(v);
}

export const VARIANTS = {
  born: { moved: [] },
  noRest: { moved: ['rest', 'sleep'] },
  noFood: { moved: ['carry', 'pursue'] },
  noClues: { moved: ['scent', 'memory', 'zigzag'] },
  noWarmth: { moved: ['thermal', 'shelter', 'dusk', 'huddle'] },
  noPantry: { moved: ['pantry', 'eatCarried'] },
  learns: { moved: [], learn: 1 },
  // Taking learning apart: trials without writing (no room for her own lines),
  // and writing without trials past the first hour.
  trialsOnly: { moved: [], learn: 1, set: { 'PROGRAM.maxOwn': 0 } },
  crisis: { moved: [], learn: 1, set: { 'PROGRAM.crisis': 1, 'PROGRAM.explore': 0 } },
  // Trials scaled by her state (PROGRAM.exploreByState).
  trialsByState: { moved: [], learn: 1, set: { 'PROGRAM.maxOwn': 0, 'PROGRAM.exploreByState': 1 } },
  learnsByState: { moved: [], learn: 1, set: { 'PROGRAM.exploreByState': 1 } },
  // How far ahead she judges a choice (PROGRAM.horizon, 15 s by default).
  horizon60: { moved: [], learn: 1, set: { 'PROGRAM.exploreByState': 1, 'PROGRAM.horizon': 60 } },
  reserves: { moved: [], learn: 1, set: { 'PROGRAM.exploreByState': 1, 'PROGRAM.judge': 1 } },
  reserves60: { moved: [], learn: 1, set: { 'PROGRAM.exploreByState': 1, 'PROGRAM.judge': 1, 'PROGRAM.horizon': 60 } },
  // Can learning repair a broken program? (the judge's real test)
  noWarmthDistress: { moved: ['thermal', 'shelter', 'dusk', 'huddle'], learn: 1, set: { 'PROGRAM.exploreByState': 1 } },
  noWarmthReserves: { moved: ['thermal', 'shelter', 'dusk', 'huddle'], learn: 1, set: { 'PROGRAM.exploreByState': 1, 'PROGRAM.judge': 1 } },
  noRestDistress: { moved: ['rest', 'sleep'], learn: 1, set: { 'PROGRAM.exploreByState': 1 } },
  noRestReserves: { moved: ['rest', 'sleep'], learn: 1, set: { 'PROGRAM.exploreByState': 1, 'PROGRAM.judge': 1 } },
  onlyThermal: { moved: ['thermal'] },
  onlyShelter: { moved: ['shelter'] },
  onlyDusk: { moved: ['dusk'] },
  onlyHuddle: { moved: ['huddle'] },
  noWarmthNight: { moved: ['thermal', 'shelter', 'dusk', 'huddle'], learn: 1, set: { 'PROGRAM.exploreByState': 1, 'PROGRAM.judge': 1, 'PROGRAM.darkTrials': 1 } },
  onlyDuskNight: { moved: ['dusk'], learn: 1, set: { 'PROGRAM.exploreByState': 1, 'PROGRAM.judge': 1, 'PROGRAM.darkTrials': 1 } },
  onlyDuskReserves: { moved: ['dusk'], learn: 1, set: { 'PROGRAM.exploreByState': 1, 'PROGRAM.judge': 1 } },
  reservesNight: { moved: [], learn: 1, set: { 'PROGRAM.exploreByState': 1, 'PROGRAM.judge': 1, 'PROGRAM.darkTrials': 1 } },
  horizon120: { moved: [], learn: 1, set: { 'PROGRAM.exploreByState': 1, 'PROGRAM.horizon': 120 } },
};
const ONLY = arg('only', null)?.split(',');
const defaults = {};

function setAll(set) {
  for (const [path, v] of Object.entries(set ?? {})) {
    const [group, key] = path.split('.');
    if (!(path in defaults)) defaults[path] = CONFIG[group][key];
    CONFIG[group][key] = v;
  }
}

function life(seed, variant) {
  setAll(defaults);
  setAll(variant.set);
  CONFIG.PROGRAM.watch = variant.learn ? 1 : 0;
  CONFIG.PROGRAM.learn = variant.learn ? 1 : 0;
  const mapSeed = MAPS === 'varied' ? 4000 + seed : Number(MAPS);
  const world = withRng(rng(mapSeed), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(seed * 7919);
  const herRng = rng(seed);
  const fagi = withRng(herRng, () => createFagi());
  if (variant.moved.length) {
    const p = programOf(fagi);
    const moved = p.lines.filter((l) => variant.moved.includes(l.id));
    p.lines = [...p.lines.filter((l) => !moved.includes(l)), ...moved];
  }
  for (let s = 0; s < SECS / DT && fagi.alive; s++) {
    withRng(worldRng, () => stepWorld(world, DT));
    withRng(herRng, () => updateFagi(fagi, world, DT));
  }
  const p = programOf(fagi);
  return { firstAt: Math.min(...p.lines.filter((l) => l.source === 'self').map((l) => l.learnedAt)), own: p.lines.filter((l) => l.source === 'self').map((l) => l.id + (l.retired ? '(x)' : '')), trials: fagi.brain.watch?.stats?.trials ?? 0, alive: fagi.alive ? 1 : 0, lived: Math.min(fagi.age, SECS), eaten: fagi.eaten ?? 0, cause: fagi.alive ? 'alive' : (fagi.cause ?? fagi.deathCause ?? 'died') };
}

const seeds = Array.from({ length: RUNS }, (_, i) => SEED0 + i);
const out = {};
for (const [name, v] of Object.entries(VARIANTS)) {
  if (ONLY && !ONLY.includes(name)) continue;
  const rows = seeds.map((s) => life(s, v));
  const causes = {};
  for (const r of rows) causes[r.cause] = (causes[r.cause] ?? 0) + 1;
  out[name] = {
    alive: rows.reduce((a, r) => a + r.alive, 0) / RUNS,
    lived: rows.reduce((a, r) => a + r.lived, 0) / RUNS,
    eaten: rows.reduce((a, r) => a + r.eaten, 0) / RUNS,
    causes, aliveBySeed: rows.map((r) => r.alive), livedBySeed: rows.map((r) => Math.round(r.lived)),
    firstAt: rows.map((r) => (Number.isFinite(r.firstAt) ? Math.round(r.firstAt) : null)),
    trials: rows.reduce((a, r) => a + r.trials, 0) / RUNS, own: rows.map((r) => r.own),
  };
}
if (argv.includes('--json')) console.log(JSON.stringify({ interval: INTERVAL, runs: RUNS, secs: SECS, out }));
else {
  console.log(`interval ${INTERVAL} s · ${RUNS} lives · ${SECS} s · maps ${MAPS}`);
  for (const [name, o] of Object.entries(out)) {
    console.log(`  ${name.padEnd(9)} alive ${o.alive.toFixed(2)}  lived ${o.lived.toFixed(0).padStart(5)}  eaten ${o.eaten.toFixed(1).padStart(5)}  ${JSON.stringify(o.causes)}`);
  }
}
