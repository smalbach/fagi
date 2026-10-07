#!/usr/bin/env node
// A crisis lived, the line it writes, and whether that line then acts.
//
// Harsh world (the one in scripts/crisis-check.js: cold nights, rain every
// 45 s, costly effort), PROGRAM.learn + watch + crisis on. Lives are run one
// seed after another until a crisis writes a line (or --tries runs out). Then
// her life goes on for --after seconds and the demo counts how long that line
// governed her decision. Everything printed is measured; nothing is assumed.
//
// A line here is data in the program grammar (src/program.js): one of her
// born behaviors put in front of another under one condition. It is not
// generated JavaScript.
//
//   node scripts/demo-proof.js [--seed 101] [--tries 20] [--secs 1200] [--after 120] [--sabotage]
//
// --sabotage moves her born `rest` and `sleep` to the end of her program first,
// so there is something to repair (said so in the output).

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
const TRIES = arg('tries', 20);
const SECS = arg('secs', 1200);
const AFTER = arg('after', 120);
const SABOTAGE = process.argv.includes('--sabotage');
const DT = 0.05;

enableOrganism();
Object.assign(CONFIG.CYCLE, { enabled: 1, seconds: 140, mean: 17, swing: 14 });
CONFIG.THERMAL.enabled = 1;
Object.assign(CONFIG.RAIN, { enabled: 1, every: 45 });
CONFIG.ENERGY.drain = 0.8;
Object.assign(CONFIG.PROGRAM, { learn: 1, watch: 1, crisis: 1 });

const lineNow = (fagi) => fagi.thought?.line ?? fagi.thought?.who?.line ?? null;

function life(seed) {
  const world = withRng(rng(seed), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(seed * 7919);
  const herRng = rng(seed);
  const fagi = withRng(herRng, () => createFagi());
  if (SABOTAGE) {
    const p = programOf(fagi);
    const moved = p.lines.filter((l) => l.id === 'rest' || l.id === 'sleep');
    p.lines = [...p.lines.filter((l) => !moved.includes(l)), ...moved];
  }
  const step = () => { withRng(worldRng, () => stepWorld(world, DT)); withRng(herRng, () => updateFagi(fagi, world, DT)); };

  let written = null;
  let before = null;
  for (let s = 0; s < SECS / DT && fagi.alive; s++) {
    const was = { action: fagi.thought?.action ?? null, line: lineNow(fagi) };
    step();
    const own = programOf(fagi).lines.find((l) => isCrisisLine(l) && !l.retired);
    if (own) { written = own; before = was; break; }
  }
  if (!written) return { seed, fagi, written: null };

  const at = fagi.age;
  const state = {
    temperature: fagi.temperature, thermalStress: fagi.thermalStress ?? 0,
    energy: fagi.energy, hunger: fagi.hunger, thirst: fagi.thirst,
    dark: Boolean(fagi.dark), raining: Boolean(fagi.raining),
  };
  let acted = 0;
  let firstActed = null;
  const actions = {};
  for (let s = 0; s < AFTER / DT && fagi.alive; s++) {
    step();
    if (lineNow(fagi) === written.id) {
      acted += DT;
      firstActed ??= fagi.age - at;
      const a = fagi.thought?.action ?? '?';
      actions[a] = (actions[a] ?? 0) + DT;
    }
  }
  const still = programOf(fagi).lines.find((l) => l.id === written.id);
  return { seed, fagi, written, before, at, state, acted, firstActed, actions, retired: Boolean(still?.retired) };
}

const f1 = (v) => (v == null ? '—' : Number(v).toFixed(1));

console.log('='.repeat(72));
console.log('DEMO: una crisis vivida, la línea que escribe y si después actúa');
console.log(`Mundo duro (noches frías, lluvia cada 45 s, esfuerzo caro)${SABOTAGE ? ' · SABOTAJE: rest y sleep movidos al final' : ''}`);
console.log('='.repeat(72));

let r = null;
for (let i = 0; i < TRIES; i++) {
  const seed = SEED + i;
  r = life(seed);
  console.log(`semilla ${seed}: ${r.written ? `línea escrita a los ${f1(r.at)} s` : `sin línea en ${f1(Math.min(r.fagi.age, SECS))} s (${r.fagi.alive ? 'viva' : `muere: ${r.fagi.cause}`}; crisis vividas: ${r.fagi.brain.crisis?.stats.onsets ?? 0})`}`);
  if (r.written) break;
}

if (!r?.written) {
  console.log(`\nResultado: ninguna crisis escribió una línea en ${TRIES} vidas. Eso es lo que hace hoy el módulo en este mundo.`);
  process.exit(0);
}

const { written, before, state, acted, firstActed, actions, retired } = r;
console.log('\n1. Situación en el momento de escribir');
console.log(`   temperatura ${f1(state.temperature)} °C · estrés térmico ${f1(state.thermalStress * 100)} % · energía ${f1(state.energy)} · hambre ${f1(state.hunger)} · sed ${f1(state.thirst)}`);
console.log(`   oscuro ${state.dark} · lloviendo ${state.raining}`);
console.log(`   justo antes hacía "${before.action}" (línea "${before.line}")`);

console.log('\n2. La línea (datos en la gramática del programa, no JavaScript)');
console.log(`   ${renderLine(written)}`);
console.log(`   por qué: "${written.why}"`);

console.log(`\n3. Los ${AFTER} s siguientes`);
console.log(`   la línea gobernó su decisión ${f1(acted)} s${firstActed != null ? ` (la primera vez a los ${f1(firstActed)} s)` : ''}`);
for (const [a, t] of Object.entries(actions)) console.log(`     ${a.padEnd(16)} ${f1(t)} s`);
console.log(`   retirada después: ${retired} · al final ${r.fagi.alive ? 'viva' : `muerta (${r.fagi.cause})`}`);

console.log('\n' + '='.repeat(72));
if (acted === 0) console.log('Resultado: la línea se escribió pero no llegó a actuar en ese tiempo: es decoración.');
else console.log(`Resultado: la línea cambió qué la gobierna durante ${f1(acted)} s. Si eso la ayudó o no, lo dice scripts/demo-counterfactual.js (vida gemela sin crisis).`);
console.log('='.repeat(72));
