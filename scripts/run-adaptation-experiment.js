#!/usr/bin/env node
// Paired check: born program vs her program learning (PROGRAM.learn + watch +
// crisis) in a harsh world. 10 seeds and 600 s: a smoke test, not evidence.
// The lines it lists are data in the program grammar (src/program.js), not
// generated JavaScript. See docs/research/one-shot-crisis-plasticity.md.

import * as CONFIG from '../src/config.js';
import { enableOrganism } from '../src/organism.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import { rng, withRng } from './batch/random.js';
import { programOf } from '../src/program.js';

enableOrganism();

// Experimental environmental stress:
// Diurnal cycles with freezing nights and accelerated showers to test survival adaptability
CONFIG.CYCLE.enabled = 1;
CONFIG.CYCLE.seconds = 140;      // 70s day, 70s night
CONFIG.CYCLE.mean = 17;          // lower mean temperature
CONFIG.CYCLE.swing = 14;         // nights dip to 3°C (lethal range)
CONFIG.THERMAL.enabled = 1;
CONFIG.RAIN.enabled = 1;
CONFIG.RAIN.every = 45;          // frequent showers
CONFIG.ENERGY.drain = 0.8;       // high exertion cost
CONFIG.PHERO.life = 60;

const SEEDS = [101, 202, 303, 404, 505, 606, 707, 808, 909, 1010];
const HORIZON = 600; // 10 minutes simulated
const DT = 0.05;

function runCondition({ seed, plastic }) {
  // Configure plasticity condition
  CONFIG.PROGRAM.learn = plastic ? 1 : 0;
  CONFIG.PROGRAM.watch = plastic ? 1 : 0;
  CONFIG.PROGRAM.crisis = plastic ? 1 : 0;
  CONFIG.PROGRAM.chaining = plastic ? 1 : 0;
  CONFIG.PROGRAM.compound = plastic ? 1 : 0;

  const worldRng = rng(seed * 7919);
  const fagiRng = rng(seed);

  const world = withRng(rng(seed), () => {
    const w = createWorld();
    generateMap(w);
    return w;
  });

  const fagi = withRng(fagiRng, () => createFagi());

  let totalDistress = 0;
  let steps = 0;
  let firstCodeWrittenAt = null;

  const maxSteps = Math.ceil(HORIZON / DT);
  for (let s = 0; s < maxSteps && fagi.alive; s++) {
    withRng(worldRng, () => stepWorld(world, DT));
    withRng(fagiRng, () => updateFagi(fagi, world, DT));

    const distress = Math.max(
      fagi.hunger / 100,
      fagi.thirst / 100,
      1 - fagi.energy / 100,
      (fagi.thermalStress ?? 0) / 1.0
    );
    totalDistress += distress * DT;
    steps++;

    if (plastic && firstCodeWrittenAt === null) {
      const ownLines = programOf(fagi).lines.filter((l) => l.source === 'self');
      if (ownLines.length > 0) {
        firstCodeWrittenAt = ownLines[0].learnedAt ?? (s * DT);
      }
    }
  }

  const prog = programOf(fagi);
  const ownLines = prog.lines.filter((l) => l.source === 'self');

  return {
    seed,
    alive: fagi.alive ? 1 : 0,
    lived: Math.min(fagi.age, HORIZON),
    distressAUC: Math.round((totalDistress / Math.max(1, fagi.age)) * 1000) / 1000,
    cause: fagi.alive ? 'survived' : (fagi.cause || 'died'),
    codeLines: ownLines.length,
    firstWritten: firstCodeWrittenAt,
    synthesizedCode: ownLines.map((l) => ({
      id: l.id,
      do: l.do,
      chain: l.chain,
      if: l.if,
      why: l.why,
    })),
  };
}

console.log('='.repeat(78));
console.log('PAIRED CHECK: PROGRAM LEARNING + CRISIS VS BORN PROGRAM');
console.log('   Environmental Regime: Harsh Diurnal Cycling (140s) + Cold Nights + Rain');
console.log(`   Replicates: ${SEEDS.length} Paired Random Seeds | Horizon: ${HORIZON}s`);
console.log('='.repeat(78));

const controlResults = [];
const plasticResults = [];

for (const seed of SEEDS) {
  process.stdout.write(`Seed ${seed.toString().padStart(4)}: Running Control... `);
  const ctrl = runCondition({ seed, plastic: false });
  controlResults.push(ctrl);

  process.stdout.write(`Plastic... `);
  const plas = runCondition({ seed, plastic: true });
  plasticResults.push(plas);

  console.log(`[Ctrl: ${ctrl.alive ? 'ALIVE' : ctrl.cause.padEnd(8)} (${Math.round(ctrl.lived)}s) | Plas: ${plas.alive ? 'ALIVE' : plas.cause.padEnd(8)} (${Math.round(plas.lived)}s, ${plas.codeLines} lines)]`);
}

// Statistical Summaries
const ctrlSurvival = (controlResults.filter((r) => r.alive).length / SEEDS.length) * 100;
const plasSurvival = (plasticResults.filter((r) => r.alive).length / SEEDS.length) * 100;

const ctrlMeanLife = controlResults.reduce((a, b) => a + b.lived, 0) / SEEDS.length;
const plasMeanLife = plasticResults.reduce((a, b) => a + b.lived, 0) / SEEDS.length;

const totalLines = plasticResults.reduce((a, b) => a + b.codeLines, 0);
const meanLines = totalLines / SEEDS.length;

const writtenTimes = plasticResults.filter((r) => r.firstWritten != null).map((r) => r.firstWritten);
const meanLatency = writtenTimes.length ? (writtenTimes.reduce((a, b) => a + b, 0) / writtenTimes.length) : null;

// Paired difference
const pairedLifespanDiff = plasticResults.map((p, i) => p.lived - controlResults[i].lived);
const meanLifespanGain = pairedLifespanDiff.reduce((a, b) => a + b, 0) / SEEDS.length;

console.log('\n' + '='.repeat(78));
console.log(`RESULTS (${SEEDS.length} seeds: too few for any claim)`);
console.log('='.repeat(78));
console.log(`Metric                          | Born program    | Learning+crisis  | Difference`);
console.log('-'.repeat(78));
console.log(`Survival Rate (%)               | ${ctrlSurvival.toFixed(1).padStart(14)}% | ${plasSurvival.toFixed(1).padStart(15)}% | ${((plasSurvival - ctrlSurvival) >= 0 ? '+' : '')}${(plasSurvival - ctrlSurvival).toFixed(1)} pp`);
console.log(`Mean Lifespan (seconds)         | ${ctrlMeanLife.toFixed(1).padStart(14)}s | ${plasMeanLife.toFixed(1).padStart(15)}s | ${((meanLifespanGain >= 0 ? '+' : ''))}${meanLifespanGain.toFixed(1)} s`);
console.log(`Self-Written Lines (mean/fagi)  |           0.00 | ${meanLines.toFixed(2).padStart(16)} | +${meanLines.toFixed(2)} lines`);
console.log(`First own line (mean, writers)  |            N/A | ${meanLatency ? meanLatency.toFixed(1) + 's' : 'N/A'} (${writtenTimes.length}/${SEEDS.length} wrote)`);
console.log('-'.repeat(78));

console.log('\nLINES SHE WROTE (program grammar: a born behavior put before another, under one condition):');
const allSynthesized = plasticResults.flatMap((r) => r.synthesizedCode);
const uniqueSynthesized = new Map();
for (const s of allSynthesized) {
  if (!uniqueSynthesized.has(s.id)) uniqueSynthesized.set(s.id, s);
}

for (const [id, s] of uniqueSynthesized.entries()) {
  const chainStr = s.chain ? ` -> [${s.chain.join(', ')}]` : '';
  const condStr = s.if ? ` IF ${JSON.stringify(s.if)}` : '';
  console.log(`  • ${id}${condStr}${chainStr}`);
  console.log(`    why: "${s.why}"`);
}
console.log('='.repeat(78));
