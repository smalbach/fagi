#!/usr/bin/env node
// Does walking in circles (fixed in the game by 5ae91a8, off in research) shape
// the research world the inheritance studies run in? Single lives in that world
// (organism, one fruit every TREE.interval s, map seed 4000 + seed), with the
// three fixes off or on, born program or learning, intact or with lines moved
// last. Per life: survival, cause of death, lines she wrote, and the share of
// her moving time spent looping: an 8 s window in which she turned a full circle
// and ended under a quarter of the way she walked from where she began (the
// measure behind 5ae91a8).
//
//   node scripts/circles-pilot.js --fixes 0|1|bare,arrive,ahead,wait --arm born|learn [--sabotage dusk]
//     [--seed0 600000] [--from 0] [--to 48] [--secs 7200] [--interval 575] [--patience s] [--set GROUP.key=v]...
// Prints one JSON array: a row per life.

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
// --fixes 0 | 1 (bare, arrive, ahead) | a comma list of bare, arrive, ahead, wait.
const FIXES = arg('fixes', '0');
const on = (name) => (FIXES === '1' && name !== 'wait') || FIXES.split(',').includes(name);
const ARM = arg('arm', 'born');
const SABOTAGE = arg('sabotage', '') ? arg('sabotage').split(',') : [];
const SEED0 = Number(arg('seed0', 600000));
const FROM = Number(arg('from', 0));
const TO = Number(arg('to', 48));
const SECS = Number(arg('secs', 7200));
const DT = 0.05;
const WINDOW = 8;
const SAMPLE = 0.5;

enableOrganism();
CONFIG.TREE.interval = Number(arg('interval', 575));
CONFIG.SOURCES.bare = on('bare') ? 1 : 0;
CONFIG.PLUME.arrive = on('arrive') ? 1 : 0;
CONFIG.PHERO.ahead = on('ahead') ? 1 : 0;
CONFIG.SOURCES.wait = on('wait') ? 1 : 0;
if (arg('patience')) CONFIG.SOURCES.patience = Number(arg('patience'));
for (let i = 0; i < argv.length; i++) {
  if (argv[i] !== '--set') continue;
  const [path, v] = argv[i + 1].split('=');
  const [group, key] = path.split('.');
  if (!(key in CONFIG[group])) throw new Error(`unknown parameter ${path}`);
  CONFIG[group][key] = Number.isNaN(Number(v)) ? v : Number(v);
}
const learn = ARM === 'learn';
CONFIG.PROGRAM.watch = learn ? 1 : 0;
CONFIG.PROGRAM.learn = learn ? 1 : 0;
if (learn) { CONFIG.PROGRAM.judge = 1; CONFIG.PROGRAM.darkTrials = 1; CONFIG.PROGRAM.exploreByState = 1; }

// Looping share of the moving time, from samples every SAMPLE s.
function loops(track) {
  let moving = 0, looping = 0;
  const per = Math.round(WINDOW / SAMPLE);
  for (let i = 0; i + per < track.length; i += per) {
    let walked = 0, turned = 0;
    for (let k = i + 1; k <= i + per; k++) {
      walked += Math.hypot(track[k].x - track[k - 1].x, track[k].y - track[k - 1].y);
      let da = track[k].a - track[k - 1].a;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      turned += da;
    }
    if (walked < 20) continue;
    moving += 1;
    const net = Math.hypot(track[i + per].x - track[i].x, track[i + per].y - track[i].y);
    if (Math.abs(turned) >= 2 * Math.PI && net < walked / 4) looping += 1;
  }
  return { moving: moving * WINDOW, loopShare: moving ? looping / moving : 0 };
}

const rows = [];
for (let i = FROM; i < TO; i++) {
  const seed = SEED0 + i;
  const world = withRng(rng(4000 + seed), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(seed * 7919);
  const herRng = rng(seed);
  const fagi = withRng(herRng, () => createFagi());
  if (SABOTAGE.length) {
    const p = programOf(fagi);
    const moved = p.lines.filter((l) => SABOTAGE.includes(l.id));
    p.lines = [...p.lines.filter((l) => !moved.includes(l)), ...moved];
  }
  const track = [];
  const every = Math.round(SAMPLE / DT);
  for (let s = 0; s < SECS / DT && fagi.alive; s++) {
    withRng(worldRng, () => stepWorld(world, DT));
    withRng(herRng, () => updateFagi(fagi, world, DT));
    if (s % every === 0) track.push({ x: fagi.x, y: fagi.y, a: fagi.angle });
  }
  const lines = programOf(fagi).lines;
  rows.push({
    fixes: FIXES, arm: ARM, sabotage: SABOTAGE.join(','), i, seed,
    alive: fagi.alive ? 1 : 0, lived: Math.round(Math.min(fagi.age, SECS)), eaten: fagi.eaten ?? 0,
    cause: fagi.alive ? 'alive' : fagi.cause, ...loops(track),
    own: lines.filter((l) => l.source === 'self' && !l.retired).map((l) => l.id),
  });
}
console.log(JSON.stringify(rows));
