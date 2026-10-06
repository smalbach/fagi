#!/usr/bin/env node
// A short check of one-trial learning (src/program/crisis.js).
//
// Paired by seed, the same harsh world (cold nights, rain, costly effort), and
// her ordinary learning on in both arms (PROGRAM.learn, PROGRAM.watch): the
// only difference is PROGRAM.crisis. Then the same in a mild world, where
// nothing acute should happen and nothing should be written.
//
// What to look at:
//   onsets / written / retired   crises she lived, lines they wrote, lines
//                                her next crises took back
//   crisis-line s                seconds a line written by a crisis acted:
//                                0 means the line is decoration
//   distress, cold s, eaten      paired difference (crisis − control) and t
//   mild world                   should write ~nothing
//   sabotage                     her born `rest` and `sleep` moved to the end of her
//                                program: crises should write lines that
//                                put rest (or what relieves her) back in
//                                front, and those should act
//
//   node scripts/crisis-check.js [--seeds 12] [--secs 1200]

import * as CONFIG from '../src/config.js';
import { enableOrganism } from '../src/organism.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import { programOf } from '../src/program.js';
import { isCrisisLine } from '../src/program/crisis.js';
import { rng, withRng } from './batch/random.js';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? Number(process.argv[i + 1]) : d; };
const N = arg('seeds', 12);
const SECS = arg('secs', 1200);
const DT = 0.05;

enableOrganism();
const base = structuredClone({ CYCLE: CONFIG.CYCLE, RAIN: CONFIG.RAIN, ENERGY: CONFIG.ENERGY, THERMAL: CONFIG.THERMAL });

function world(harsh) {
  Object.assign(CONFIG.CYCLE, base.CYCLE, { enabled: 1, seconds: 140 });
  Object.assign(CONFIG.THERMAL, base.THERMAL, { enabled: 1 });
  Object.assign(CONFIG.RAIN, base.RAIN, { enabled: 1 });
  Object.assign(CONFIG.ENERGY, base.ENERGY);
  if (harsh) Object.assign(CONFIG.CYCLE, { mean: 17, swing: 14 }), Object.assign(CONFIG.RAIN, { every: 45 }), (CONFIG.ENERGY.drain = 0.8);
  else Object.assign(CONFIG.CYCLE, { mean: 26, swing: 3 }), Object.assign(CONFIG.RAIN, { every: 1e6 });
}

function life(seed, withCrisis, sabotage) {
  CONFIG.PROGRAM.learn = 1;
  CONFIG.PROGRAM.watch = 1;
  CONFIG.PROGRAM.crisis = withCrisis ? 1 : 0;
  const w = withRng(rng(seed), () => { const x = createWorld(); generateMap(x); return x; });
  const worldRng = rng(seed * 7919);
  const herRng = rng(seed);
  const fagi = withRng(herRng, () => createFagi());
  if (sabotage) {
    const p = programOf(fagi);
    const moved = p.lines.filter((l) => sabotage.includes(l.id));
    p.lines = [...p.lines.filter((l) => !moved.includes(l)), ...moved];
  }
  let distress = 0;
  let cold = 0;
  let crisisActs = 0;
  for (let s = 0; s < SECS / DT && fagi.alive; s++) {
    withRng(worldRng, () => stepWorld(w, DT));
    withRng(herRng, () => updateFagi(fagi, w, DT));
    distress += Math.max(fagi.hunger / 100, fagi.thirst / 100, 1 - fagi.energy / 100, Math.min(1, fagi.thermalStress ?? 0)) * DT;
    if ((fagi.thermalStress ?? 0) > 0.3) cold += DT;
    const id = fagi.thought?.line ?? fagi.thought?.who?.line;
    if (id && isCrisisLine(programOf(fagi).lines.find((l) => l.id === id) ?? {})) crisisActs += DT;
  }
  const c = fagi.brain.crisis?.stats ?? { onsets: 0, written: 0, retired: 0 };
  const lines = programOf(fagi).lines.filter(isCrisisLine);
  return {
    alive: fagi.alive ? 1 : 0, lived: Math.min(fagi.age, SECS), distress: distress / Math.max(1, fagi.age),
    cold, eaten: fagi.eaten ?? 0, crisisActs, ...c, lines: lines.map((l) => `${l.id}${l.retired ? ' (retired)' : ''}`),
  };
}

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
function paired(ctrl, test, k) {
  const d = test.map((r, i) => r[k] - ctrl[i][k]);
  const m = mean(d);
  const sd = Math.sqrt(d.reduce((a, x) => a + (x - m) ** 2, 0) / Math.max(1, d.length - 1));
  const t = sd > 0 ? m / (sd / Math.sqrt(d.length)) : 0;
  return `${k.padEnd(10)} control ${mean(ctrl.map((r) => r[k])).toFixed(3).padStart(9)}  crisis ${mean(test.map((r) => r[k])).toFixed(3).padStart(9)}  diff ${m.toFixed(3).padStart(8)}  t ${t.toFixed(2)}`;
}

for (const [harsh, sabotage] of [[true, null], [false, null], [true, ['rest', 'sleep']]]) {
  world(harsh);
  const seeds = Array.from({ length: N }, (_, i) => 101 * (i + 1));
  const ctrl = seeds.map((s) => life(s, false, sabotage));
  const test = seeds.map((s) => life(s, true, sabotage));
  console.log(`\n== ${harsh ? 'harsh' : 'mild'} world${sabotage ? `, ${sabotage.join(' + ')} moved last` : ''}, ${N} seeds, ${SECS} s`);
  console.log(`onsets ${mean(test.map((r) => r.onsets)).toFixed(2)}  written ${mean(test.map((r) => r.written)).toFixed(2)}  retired ${mean(test.map((r) => r.retired)).toFixed(2)}  crisis-line s ${mean(test.map((r) => r.crisisActs)).toFixed(1)}`);
  for (const k of ['alive', 'lived', 'distress', 'cold', 'eaten']) console.log(paired(ctrl, test, k));
  const count = {};
  for (const r of test) for (const l of r.lines) count[l] = (count[l] ?? 0) + 1;
  for (const [l, n] of Object.entries(count).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}× ${l}`);
}
