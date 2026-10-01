// Does she rewrite her program where it is wrong for her, and only there?
// (program/watch.js, program/learn.js, program/share.js)
//
// Paired lives: the same maps, world and seeds, once with learning off and
// once on. She may be born with a program that is wrong on purpose
// (--sabotage): one born line moved down, below lines that should wait for
// it. A learner worth the name puts it back in front where it is wrong, and
// leaves alone a program that is not wrong. With --colony N, N sisters share
// the nest (and, with --set PROGRAM.share=1, what their lines cost them).
//
//   node scripts/program-lab.js [--world classic|organism] [--lives 24]
//        [--duration 4800] [--seed 7000] [--from 0] [--colony 1] [--sabotage rest|shelter]
//        [--set BLOCK.key=V ...] [--json file]
//
//   --sabotage rest     resting comes last: she rests only when nothing else
//                       would act (lines that should yield to it: pursue,
//                       carry, memory, scent...)
//   --sabotage shelter  taking shelter from the rain comes after pursuing food
//
// Per condition, over colonies (a lone Fagi is a colony of one): how many
// sisters lived and of what they died, their mean distress (program/watch.js
// distress), how much of their lives lines of their own decided and, learning
// on, every line written or retired: in how many colonies, by how many
// sisters, and when the first one was written.

import { writeFileSync } from 'node:fs';
import * as CONFIG from '../src/config.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { stepWorld } from '../src/simulation.js';
import { createColony, updateColony } from '../src/colony.js';
import { INNATE, createProgram, programOf } from '../src/program.js';
import { distress } from '../src/program/watch.js';
import { rng, withRng } from './batch/random.js';
import { SCENARIOS } from './trace.js';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const WORLD = opt('world', 'classic');
const LIVES = Number(opt('lives', 24));
const DURATION = Number(opt('duration', 4800));
const SEED = Number(opt('seed', 7000));
const COLONY = Number(opt('colony', 1));
const FROM = Number(opt('from', 0));
const SABOTAGE = opt('sabotage', null);
const JSON_OUT = opt('json', null);
const DT = 0.05;

// Where each sabotage puts the line: right before `before`.
const SABOTAGES = { rest: { line: 'rest', before: 'taste' }, shelter: { line: 'shelter', before: 'scent' } };

function bornProgram() {
  if (!SABOTAGE) return createProgram();
  const s = SABOTAGES[SABOTAGE];
  if (!s) throw new Error(`--sabotage: one of ${Object.keys(SABOTAGES).join(', ')}`);
  const moved = INNATE.find((l) => l.id === s.line);
  const rest = INNATE.filter((l) => l !== moved);
  rest.splice(rest.findIndex((l) => l.id === s.before), 0, moved);
  return createProgram(rest);
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const r3 = (v) => Math.round(v * 1000) / 1000;

function life(k, learn) {
  CONFIG.PROGRAM.learn = learn ? 1 : 0;
  const map = SEED + k * 101;
  const world = withRng(rng(map), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(map + 1);
  const fagiRng = rng(SEED + k);
  const colony = withRng(fagiRng, () => createColony(COLONY));
  for (const f of colony.ants) f.brain.program = bornProgram();
  const events = [];
  const heard = new Map();
  let frames = 0;
  let own = 0;
  let felt = 0;
  for (let i = 0; i < DURATION / DT && colony.ants.some((f) => f.alive); i++) {
    withRng(worldRng, () => stepWorld(world, DT));
    withRng(fagiRng, () => updateColony(world, colony, DT));
    for (const f of colony.ants) {
      const p = f.brain.lastProgram;
      if (p && p.n !== heard.get(f)) {
        heard.set(f, p.n);
        events.push({ at: Math.round(world.time), who: f.id, kind: p.kind, id: p.id, why: p.why });
      }
      // A daughter hatched this very step has not perceived anything yet.
      if (!f.alive || !f.perceived) continue;
      frames += 1;
      felt += distress(f, f.perceived);
      const l = programOf(f).lines.find((x) => x.id === f.thought?.line);
      if (l?.source === 'self') own += 1;
    }
  }
  const ants = colony.ants;
  // Each sister: when she was born (founders at 0), her generation, and when
  // she first wrote a line of her own.
  const sisters = ants.map((f) => ({
    id: f.id, generation: f.generation ?? 0, born: world.lineage?.[f.id]?.bornAt ?? 0,
    wrote: events.find((e) => e.who === f.id && e.kind === 'written')?.at ?? null,
    lived: Math.round(f.age),
  }));
  return {
    k, learn, ants: ants.length, alive: ants.filter((f) => f.alive).length, sisters,
    causes: ants.filter((f) => !f.alive).map((f) => f.cause), until: Math.round(world.time),
    distress: frames ? felt / frames : 0, own: frames ? own / frames : 0, events,
    kept: ants.map((f) => programOf(f).lines.filter((l) => !l.retired && l.source === 'self').map((l) => l.id)),
    trials: mean(ants.map((f) => f.brain.watch?.stats.trials ?? 0)),
    told: mean(ants.map((f) => f.brain.watch?.stats.told ?? 0)),
  };
}

await SCENARIOS[WORLD].setup?.();
for (let i = 0; i < args.length; i++) {
  if (args[i] !== '--set') continue;
  const [path, value] = args[i + 1].split('=');
  const [block, key] = path.split('.');
  CONFIG[block][key] = Number.isFinite(Number(value)) ? Number(value) : value;
}

const runs = [];
for (let k = FROM; k < FROM + LIVES; k++) runs.push(life(k, false), life(k, true));

function summary(learn) {
  const rs = runs.filter((r) => r.learn === learn);
  const causes = {};
  for (const r of rs) for (const c of r.causes) causes[c] = (causes[c] ?? 0) + 1;
  return {
    colonies: rs.length, sisters: rs.reduce((a, r) => a + r.ants, 0), alive: rs.reduce((a, r) => a + r.alive, 0), causes,
    distress: r3(mean(rs.map((r) => r.distress))), own: r3(mean(rs.map((r) => r.own))),
    trials: Math.round(mean(rs.map((r) => r.trials))), told: Math.round(mean(rs.map((r) => r.told))),
  };
}
// Per line: colonies where some sister wrote it, sisters that wrote it, the
// earliest it was written in each colony, and sisters still holding it at the end.
const lines = {};
for (const r of runs.filter((x) => x.learn)) {
  const firstIn = {};
  const by = {};
  for (const e of r.events.filter((x) => x.kind === 'written')) {
    firstIn[e.id] ??= e.at;
    (by[e.id] ??= new Set()).add(e.who);
  }
  for (const [id, at] of Object.entries(firstIn)) {
    const s = (lines[id] ??= { colonies: 0, sisters: 0, first: [], holding: 0 });
    s.colonies += 1;
    s.sisters += by[id].size;
    s.first.push(at);
  }
  for (const kept of r.kept) for (const id of kept) if (lines[id]) lines[id].holding += 1;
}
const pairs = runs.filter((r) => r.learn).map((on) => on.distress - runs.find((r) => !r.learn && r.k === on.k).distress);
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };

// How long after her birth each sister wrote her first line, founders apart
// from the daughters born into the colony; and how many never did (while
// alive and grown, at least PROGRAM.every seconds old).
function latency(gen) {
  const all = runs.filter((r) => r.learn).flatMap((r) => r.sisters).filter((x) => gen(x.generation) && x.lived >= CONFIG.PROGRAM.every);
  const wrote = all.filter((x) => x.wrote != null).map((x) => Math.round(x.wrote - x.born));
  return { sisters: all.length, wrote: wrote.length, median: median(wrote) };
}

const out = {
  world: WORLD, sabotage: SABOTAGE, lives: LIVES, duration: DURATION, seed: SEED, colony: COLONY, share: CONFIG.PROGRAM.share,
  off: summary(false), on: summary(true), paired: { distress: r3(mean(pairs)) },
  founders: latency((g) => g === 0), daughters: latency((g) => g > 0),
  coloniesWithLines: runs.filter((r) => r.learn && r.kept.some((k) => k.length)).length,
  lines: Object.fromEntries(Object.entries(lines).map(([id, s]) => [id, { ...s, first: median(s.first) }])),
};
console.log(`program-lab: ${WORLD}, sabotage ${SABOTAGE ?? 'none'}, ${LIVES} paired colonies of ${COLONY} × ${DURATION}s, share ${out.share}`);
console.log(`  learning off: ${JSON.stringify(out.off)}`);
console.log(`  learning on:  ${JSON.stringify(out.on)}`);
console.log(`  paired (on - off): distress ${out.paired.distress}`);
console.log(`  colonies ending with lines of their own: ${out.coloniesWithLines}/${LIVES}`);
console.log(`  first line written, after birth: founders ${JSON.stringify(out.founders)}, daughters ${JSON.stringify(out.daughters)}`);
for (const [id, s] of Object.entries(out.lines).sort((a, b) => b[1].colonies - a[1].colonies)) {
  console.log(`  ${id}: written in ${s.colonies} colonies by ${s.sisters} sisters (median first at ${s.first}s), held by ${s.holding} at the end`);
}
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ ...out, runs }, null, 1));
