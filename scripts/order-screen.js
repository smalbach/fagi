#!/usr/bin/env node
// Is there anything to learn? For every move the learner could make (one born
// line Y put right in front of a born line X above it, X not a survive line,
// no condition), lives under that program against lives under the born one,
// paired by seed. A world where some move clearly beats the born order is a
// world where learning has something to find without breaking her first.
//
//   node scripts/order-screen.js [--interval 575] [--runs 24] [--secs 7200]
//     [--seed 1000] [--part 0 --of 1] [--moves y>x,...] [--set K=V]... [--json]

import * as CONFIG from '../src/config.js';
import { enableOrganism } from '../src/organism.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import { programOf, INNATE } from '../src/program.js';
import { rng, withRng } from './batch/random.js';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const RUNS = Number(arg('runs', 24));
const SECS = Number(arg('secs', 7200));
const SEED0 = Number(arg('seed', 1000));
const PART = Number(arg('part', 0));
const OF = Number(arg('of', 1));
const DT = 0.05;

enableOrganism();
CONFIG.TREE.interval = Number(arg('interval', 575));
for (let i = 0; i < argv.length; i++) {
  if (argv[i] !== '--set') continue;
  const [path, v] = argv[i + 1].split('=');
  const [group, key] = path.split('.');
  if (!(key in CONFIG[group])) throw new Error(`unknown parameter ${path}`);
  CONFIG[group][key] = Number.isNaN(Number(v)) ? v : Number(v);
}

// Every move: [x, y] with y below x in the born order and x not survive.
export const MOVES = [];
for (let i = 0; i < INNATE.length; i++) {
  if (INNATE[i].tier === 'survive') continue;
  for (let j = i + 1; j < INNATE.length; j++) MOVES.push([INNATE[i].id, INNATE[j].id]);
}

function life(seed, move) {
  const world = withRng(rng(4000 + seed), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(seed * 7919);
  const herRng = rng(seed);
  const fagi = withRng(herRng, () => createFagi());
  if (move) {
    const p = programOf(fagi);
    const [x, y] = move;
    const moved = p.lines.find((l) => l.id === y);
    const rest = p.lines.filter((l) => l !== moved);
    rest.splice(rest.findIndex((l) => l.id === x), 0, moved);
    p.lines = rest;
  }
  for (let s = 0; s < SECS / DT && fagi.alive; s++) {
    withRng(worldRng, () => stepWorld(world, DT));
    withRng(herRng, () => updateFagi(fagi, world, DT));
  }
  return { alive: fagi.alive ? 1 : 0, lived: Math.round(Math.min(fagi.age, SECS)) };
}

const seeds = Array.from({ length: RUNS }, (_, i) => SEED0 + i);
const out = { born: seeds.map((s) => life(s, null)), moves: {} };
const ONLY = arg('moves', null)?.split(',');
MOVES.forEach((m, k) => {
  if (ONLY ? !ONLY.includes(`${m[1]}>${m[0]}`) : k % OF !== PART) return;
  out.moves[`${m[1]}>${m[0]}`] = seeds.map((s) => life(s, m));
});
if (argv.includes('--json')) console.log(JSON.stringify(out));
else {
  const a = (rows) => rows.reduce((s, r) => s + r.alive, 0) / rows.length;
  console.log(`born ${a(out.born).toFixed(2)}`);
  for (const [k, rows] of Object.entries(out.moves)) {
    const better = rows.filter((r, i) => r.alive > out.born[i].alive).length;
    const worse = rows.filter((r, i) => r.alive < out.born[i].alive).length;
    console.log(`${k.padEnd(28)} ${a(rows).toFixed(2)}  ${better}/${worse}`);
  }
}
