#!/usr/bin/env node
// Twin lives: the same seed, the same world, her ordinary learning on in
// both; the only difference is PROGRAM.crisis. The two lives run frame by
// frame side by side. Until a crisis writes a line they are the same life
// (crisis.js draws no random numbers); from then on any difference is that
// line's doing. A line can govern a decision and still do what the born
// program would have done: the demo counts both, and prints the first frame
// where the twins *act* differently and how each life ends. Everything
// printed is measured.
//
//   node scripts/demo-counterfactual.js [--seed 101] [--seeds 12] [--secs 1200] [--sabotage]
//
// Harsh world as in scripts/crisis-check.js. --sabotage moves her born `rest`
// and `sleep` to the end of her program first, so there is something to repair.

import * as CONFIG from '../src/config.js';
import { enableOrganism } from '../src/organism.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import { programOf, renderLine } from '../src/program.js';
import { isCrisisLine } from '../src/program/crisis.js';
import { rng, withRng } from './batch/random.js';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? Number(process.argv[i + 1]) : d; };
const SEED = arg('seed', 101);
const SEEDS = arg('seeds', 12);
const SECS = arg('secs', 1200);
const SABOTAGE = process.argv.includes('--sabotage');
const DT = 0.05;

enableOrganism();
Object.assign(CONFIG.CYCLE, { enabled: 1, seconds: 140, mean: 17, swing: 14 });
CONFIG.THERMAL.enabled = 1;
Object.assign(CONFIG.RAIN, { enabled: 1, every: 45 });
CONFIG.ENERGY.drain = 0.8;
Object.assign(CONFIG.PROGRAM, { learn: 1, watch: 1 });

const lineNow = (fagi) => fagi.thought?.line ?? fagi.thought?.who?.line ?? null;
const distressOf = (f) => Math.max(f.hunger / 100, f.thirst / 100, 1 - f.energy / 100, Math.min(1, f.thermalStress ?? 0));

function twin(seed, withCrisis) {
  const world = withRng(rng(seed), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(seed * 7919);
  const herRng = rng(seed);
  const fagi = withRng(herRng, () => createFagi());
  if (SABOTAGE) {
    const p = programOf(fagi);
    const moved = p.lines.filter((l) => l.id === 'rest' || l.id === 'sleep');
    p.lines = [...p.lines.filter((l) => !moved.includes(l)), ...moved];
  }
  const t = { fagi, withCrisis, distress: 0, crisisActs: 0 };
  t.step = () => {
    if (!fagi.alive) return;
    CONFIG.PROGRAM.crisis = withCrisis ? 1 : 0;
    withRng(worldRng, () => stepWorld(world, DT));
    withRng(herRng, () => updateFagi(fagi, world, DT));
    t.distress += distressOf(fagi) * DT;
    const id = lineNow(fagi);
    if (id && isCrisisLine(programOf(fagi).lines.find((l) => l.id === id) ?? {})) t.crisisActs += DT;
  };
  return t;
}

function pair(seed) {
  const a = twin(seed, false);
  const b = twin(seed, true);
  let fork = null;
  let differ = 0;
  for (let s = 0; s < SECS / DT && (a.fagi.alive || b.fagi.alive); s++) {
    a.step();
    b.step();
    const apart = a.fagi.alive && b.fagi.alive && a.fagi.thought?.action !== b.fagi.thought?.action;
    if (apart) differ += DT;
    if (!fork && apart) {
      fork = {
        at: b.fagi.age,
        without: { action: a.fagi.thought?.action, line: lineNow(a.fagi) },
        with: { action: b.fagi.thought?.action, line: lineNow(b.fagi) },
        own: programOf(b.fagi).lines.filter(isCrisisLine).map(renderLine),
      };
    }
  }
  const end = (t) => ({
    alive: t.fagi.alive, cause: t.fagi.cause ?? null, lived: Math.min(t.fagi.age, SECS),
    distress: t.distress / Math.max(1, t.fagi.age), eaten: t.fagi.eaten ?? 0,
  });
  return { seed, fork, differ, without: end(a), with: end(b), crisisActs: b.crisisActs, lines: programOf(b.fagi).lines.filter(isCrisisLine) };
}

const f1 = (v) => Number(v).toFixed(1);
const f3 = (v) => Number(v).toFixed(3);
const fate = (e) => (e.alive ? 'viva' : `muere (${e.cause}) a ${f1(e.lived)} s`);

console.log('='.repeat(72));
console.log('VIDAS GEMELAS: misma semilla, con y sin aprendizaje por crisis');
console.log(`Mundo duro · ${SEEDS} semillas desde ${SEED} · ${SECS} s${SABOTAGE ? ' · SABOTAJE: rest y sleep al final' : ''}`);
console.log('='.repeat(72));

const all = [];
for (let i = 0; i < SEEDS; i++) {
  const r = pair(SEED + i);
  all.push(r);
  if (!r.fork) {
    const said = r.lines.length
      ? `${r.lines.map((l) => l.id).join(', ')} gobernó ${f1(r.crisisActs)} s haciendo lo mismo que su gemela sin crisis`
      : 'ninguna línea escrita';
    console.log(`semilla ${r.seed}: mismas acciones toda la vida (${said}) · ${fate(r.with)}`);
    continue;
  }
  console.log(`semilla ${r.seed}: actúan distinto por primera vez a los ${f1(r.fork.at)} s (en total ${f1(r.differ)} s distintos)`);
  for (const l of r.fork.own) console.log(`    línea: ${l}`);
  console.log(`    sin crisis: "${r.fork.without.action}" (línea "${r.fork.without.line}")`);
  console.log(`    con crisis: "${r.fork.with.action}" (línea "${r.fork.with.line}")`);
  console.log(`    final  sin: ${fate(r.without)}, malestar ${f3(r.without.distress)}, comió ${r.without.eaten}`);
  console.log(`    final  con: ${fate(r.with)}, malestar ${f3(r.with.distress)}, comió ${r.with.eaten}, la línea actuó ${f1(r.crisisActs)} s`);
}

const forked = all.filter((r) => r.fork);
const better = all.filter((r) => r.with.alive && !r.without.alive).length;
const worse = all.filter((r) => !r.with.alive && r.without.alive).length;
const dd = forked.map((r) => r.with.distress - r.without.distress);
const mean = dd.length ? dd.reduce((x, y) => x + y, 0) / dd.length : 0;

console.log('\n' + '='.repeat(72));
console.log(`Vidas con alguna línea de crisis: ${all.filter((r) => r.lines.length).length}/${all.length} · vidas que actuaron distinto: ${forked.length}/${all.length}`);
console.log(`Supervivencia: con crisis vive y sin crisis muere ${better} · al revés ${worse}`);
if (forked.length) console.log(`Malestar medio (con − sin) en las que actuaron distinto: ${mean >= 0 ? '+' : ''}${f3(mean)} (negativo = la crisis ayudó)`);
if (!forked.length) console.log('Resultado: el aprendizaje por crisis no cambió ninguna acción en estas vidas.');
else if (better > worse && mean < 0) console.log('Resultado: en estas semillas la crisis ayudó. Son pocas: confírmalo con una batería emparejada antes de afirmarlo.');
else if (worse > better || mean > 0) console.log('Resultado: en estas semillas la crisis no ayudó o empeoró.');
else console.log('Resultado: sin diferencia clara.');
console.log('='.repeat(72));
