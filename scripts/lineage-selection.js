#!/usr/bin/env node
// Lineages with selection: does what mothers learned, passed on through the
// behavioral genome (src/program/genome.js), raise their daughters' survival?
//
// One population: N lives per generation, G generations, each life alone in
// its own world (map seed 4000 + seed, one fruit every TREE.interval s). In
// generation 0 every life is born; afterwards, by arm:
//   born        no learning, no inheritance
//   learn       learns in life (PROGRAM.learn), nothing inherited
//   inherit     learns, and each daughter carries the program genome of a
//               mother drawn from the survivors of the previous generation
//               (from the four longest-lived if none survived)
//   inheritAny  as inherit, the mother drawn from all, dead or alive
// World slots (seeds) are the same in every arm, so lives pair across arms.
//
//   node scripts/lineage-selection.js --arm inherit --pop 0 [--n 16] [--g 6]
//     [--secs 7200] [--interval 575] [--seed0 5000] [--sabotage dusk,...]
//     [--set PROGRAM.judge=1]...
// Prints one JSON array: a row per life.

import * as CONFIG from '../src/config.js';
import { enableOrganism } from '../src/organism.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import { programOf } from '../src/program.js';
import { applyGenome } from '../src/generations.js';
import { captureProgramGenome } from '../src/program/genome.js';
import { rng, withRng } from './batch/random.js';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const ARM = arg('arm', 'born');
const POP = Number(arg('pop', 0));
const N = Number(arg('n', 16));
const G = Number(arg('g', 6));
const SECS = Number(arg('secs', 7200));
const SEED0 = Number(arg('seed0', 5000));
const SABOTAGE = arg('sabotage', '') ? arg('sabotage').split(',') : [];
const DT = 0.05;
if (!['born', 'learn', 'inherit', 'inheritAny'].includes(ARM)) throw new Error(`unknown arm ${ARM}`);

enableOrganism();
CONFIG.TREE.interval = Number(arg('interval', 575));
for (let i = 0; i < argv.length; i++) {
  if (argv[i] !== '--set') continue;
  const [path, v] = argv[i + 1].split('=');
  const [group, key] = path.split('.');
  if (!(key in CONFIG[group])) throw new Error(`unknown parameter ${path}`);
  CONFIG[group][key] = Number.isNaN(Number(v)) ? v : Number(v);
}
const learn = ARM !== 'born';
const inherit = ARM === 'inherit' || ARM === 'inheritAny';
CONFIG.PROGRAM.watch = learn ? 1 : 0;
CONFIG.PROGRAM.learn = learn ? 1 : 0;

const pick = rng(777 + POP);
let parents = null;
const rows = [];
for (let g = 0; g < G; g++) {
  const gen = [];
  for (let i = 0; i < N; i++) {
    const seed = SEED0 + POP * 1000 + g * N + i;
    const world = withRng(rng(4000 + seed), () => { const w = createWorld(); generateMap(w); return w; });
    const worldRng = rng(seed * 7919);
    const herRng = rng(seed);
    const fagi = withRng(herRng, () => createFagi());
    let mother = null;
    if (inherit && parents) {
      const alive = parents.filter((p) => p.alive);
      const pool = ARM === 'inherit' ? (alive.length ? alive : [...parents].sort((a, b) => b.lived - a.lived).slice(0, 4)) : parents;
      mother = pool[Math.floor(pick() * pool.length)];
      applyGenome(fagi, { ...(fagi.genome ?? { cues: {} }), program: mother.genome });
    } else if (SABOTAGE.length) {
      const p = programOf(fagi);
      const moved = p.lines.filter((l) => SABOTAGE.includes(l.id));
      p.lines = [...p.lines.filter((l) => !moved.includes(l)), ...moved];
    }
    for (let s = 0; s < SECS / DT && fagi.alive; s++) {
      withRng(worldRng, () => stepWorld(world, DT));
      withRng(herRng, () => updateFagi(fagi, world, DT));
    }
    const lines = programOf(fagi).lines;
    const genome = learn ? captureProgramGenome(fagi) : null;
    gen.push({ alive: fagi.alive ? 1 : 0, lived: Math.min(fagi.age, SECS), genome });
    rows.push({
      arm: ARM, pop: POP, g, i, seed, mother: mother ? parents.indexOf(mother) : null,
      alive: fagi.alive ? 1 : 0, lived: Math.round(Math.min(fagi.age, SECS)), eaten: fagi.eaten ?? 0,
      cause: fagi.alive ? 'alive' : fagi.cause,
      journal: genome ? genome.changes.length : 0,
      inherited: lines.filter((l) => l.source === 'inherited' && !l.retired).map((l) => l.id),
      own: lines.filter((l) => l.source === 'self' && !l.retired).map((l) => l.id),
    });
  }
  parents = gen;
}
console.log(JSON.stringify(rows));
