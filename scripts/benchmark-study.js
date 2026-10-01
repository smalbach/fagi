// Comparative Scientific Study: Autonomous Self-Programming & Niche Construction
// Evaluates 4 experimental conditions across paired seeds:
//   1. Innate Control: Learning disabled (hardcoded baseline)
//   2. Legacy Atomic: Conservative credit assignment (horizon=60s, minSupport=10, no macros)
//   3. Plastic Synthesis: Tight horizon (15s), minSupport=3, compound inductive guards & macro chains
//   4. Full Neurosymbolic: Plastic synthesis + Niche soil compaction + Night Mind dream reflection
//
// Usage: node scripts/benchmark-study.js [--reps 10] [--duration 2400] [--colony 1] [--sabotage rest|shelter]

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

const REPS = Number(opt('reps', 8));
const DURATION = Number(opt('duration', 1800));
const COLONY = Number(opt('colony', 1));
const SABOTAGE = opt('sabotage', 'rest');
const DT = 0.05;

const SABOTAGES = {
  rest: { line: 'rest', before: 'taste' },
  shelter: { line: 'shelter', before: 'scent' },
};

function bornProgram() {
  if (!SABOTAGE) return createProgram();
  const s = SABOTAGES[SABOTAGE];
  if (!s) return createProgram();
  const moved = INNATE.find((l) => l.id === s.line);
  const rest = INNATE.filter((l) => l !== moved);
  rest.splice(rest.findIndex((l) => l.id === s.before), 0, moved);
  return createProgram(rest);
}

function runReplicate(k, condition) {
  return withRng(rng(7000 + k), () => {
    // Configure settings according to condition
    if (condition === 'innate') {
      CONFIG.PROGRAM.learn = 0;
      CONFIG.PROGRAM.watch = 0;
    } else if (condition === 'legacy') {
      CONFIG.PROGRAM.learn = 1;
      CONFIG.PROGRAM.watch = 1;
      CONFIG.PROGRAM.horizon = 60;
      CONFIG.PROGRAM.minSupport = 10;
      CONFIG.PROGRAM.every = 60;
      CONFIG.PROGRAM.compound = 0;
      CONFIG.PROGRAM.chaining = 0;
      CONFIG.NIGHTAI.enabled = 0;
    } else if (condition === 'plastic') {
      CONFIG.PROGRAM.learn = 1;
      CONFIG.PROGRAM.watch = 1;
      CONFIG.PROGRAM.horizon = 15;
      CONFIG.PROGRAM.minSupport = 3;
      CONFIG.PROGRAM.every = 20;
      CONFIG.PROGRAM.strictness = 0.5;
      CONFIG.PROGRAM.compound = 1;
      CONFIG.PROGRAM.chaining = 1;
      CONFIG.NIGHTAI.enabled = 0;
    } else if (condition === 'neurosymbolic') {
      CONFIG.PROGRAM.learn = 1;
      CONFIG.PROGRAM.watch = 1;
      CONFIG.PROGRAM.horizon = 15;
      CONFIG.PROGRAM.minSupport = 3;
      CONFIG.PROGRAM.every = 20;
      CONFIG.PROGRAM.strictness = 0.5;
      CONFIG.PROGRAM.compound = 1;
      CONFIG.PROGRAM.chaining = 1;
      CONFIG.NIGHTAI.enabled = 1;
    }

    const world = createWorld(SCENARIOS.classic.world);
    world.time = 0;
    world.dt = DT;
    generateMap(world);

    const colony = createColony(COLONY);
    for (const f of colony.ants) f.brain.program = bornProgram();

    const events = [];
    const heard = new Map();
    let distressSum = 0;
    let sampleCount = 0;

    for (let t = 0; t < DURATION && colony.ants.some((a) => a.alive); t += DT) {
      stepWorld(world, DT);
      updateColony(world, colony, DT);

      for (const f of colony.ants) {
        const p = f.brain.lastProgram;
        if (p && p.n !== heard.get(f)) {
          heard.set(f, p.n);
          events.push({ at: Math.round(world.time), who: f.id, ...p });
        }
        if (f.alive && f.perceived) {
          distressSum += distress(f, f.perceived);
          sampleCount += 1;
        }
      }
    }

    const aliveCount = colony.ants.filter((a) => a.alive).length;
    const meanDistress = sampleCount > 0 ? distressSum / sampleCount : 0;
    const writtenEvents = events.filter((e) => e.kind === 'written');
    const firstWrittenTime = writtenEvents.length > 0 ? writtenEvents[0].at : null;

    // Measure niche construction (mud treading)
    let totalTread = 0;
    for (const m of world.mud ?? []) totalTread += (m.tread ?? 0);

    return {
      k, condition, aliveCount, totalAnts: colony.ants.length,
      meanDistress,
      codeLinesWritten: writtenEvents.length,
      firstWrittenTime,
      totalTread,
      writtenRules: writtenEvents.map((e) => e.id),
    };
  });
}

const mean = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const std = (arr, m = mean(arr)) => arr.length > 1 ? Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1)) : 0;
const r3 = (v) => Math.round(v * 1000) / 1000;

console.log(`========================================================================`);
console.log(`AUTONOMOUS SELF-PROGRAMMING & NICHE CONSTRUCTION BENCHMARK`);
console.log(`Replicates: ${REPS} | Duration: ${DURATION}s | Sabotage: ${SABOTAGE}`);
console.log(`========================================================================\n`);

const CONDITIONS = ['innate', 'legacy', 'plastic', 'neurosymbolic'];
const results = {};

for (const cond of CONDITIONS) {
  process.stdout.write(`Running ${cond.toUpperCase()} condition (${REPS} paired replicates)... `);
  const repResults = [];
  for (let k = 0; k < REPS; k++) {
    repResults.push(runReplicate(k, cond));
  }
  results[cond] = repResults;
  console.log(`Done.`);
}

console.log(`\n### SCIENTIFIC COMPARISON TABLE\n`);
console.log(`| Condition | Survival (%) | Mean Distress | Distress Red. vs Control | Code Lines Synthesized | Latency to 1st Code (s) |`);
console.log(`| :--- | :--- | :--- | :--- | :--- | :--- |`);

const controlDistress = mean(results.innate.map((r) => r.meanDistress));

for (const cond of CONDITIONS) {
  const reps = results[cond];
  const survRate = Math.round((reps.reduce((a, r) => a + r.aliveCount, 0) / reps.reduce((a, r) => a + r.totalAnts, 0)) * 100);
  const mDist = mean(reps.map((r) => r.meanDistress));
  const sDist = std(reps.map((r) => r.meanDistress), mDist);
  const diffVsControl = controlDistress - mDist;
  const mLines = r3(mean(reps.map((r) => r.codeLinesWritten)));
  const latencies = reps.map((r) => r.firstWrittenTime).filter((t) => t != null);
  const mLatency = latencies.length ? Math.round(mean(latencies)) : '—';

  const label = {
    innate: '1. Innate Control (No Plasticity)',
    legacy: '2. Legacy Reordering (Conservative)',
    plastic: '3. Plastic Synthesis (Macros + Conjunctions)',
    neurosymbolic: '4. Full Neurosymbolic + Niche Engineering',
  }[cond];

  const diffStr = diffVsControl >= 0 ? `-${r3(diffVsControl)}` : `+${r3(-diffVsControl)}`;
  console.log(`| ${label} | ${survRate}% | ${r3(mDist)} ± ${r3(sDist)} | ${diffStr} | ${mLines} lines | ${mLatency} |`);
}

// Effect size (Cohen's d) between Plastic Synthesis and Innate Control
const plasticDists = results.plastic.map((r) => r.meanDistress);
const innateDists = results.innate.map((r) => r.meanDistress);
const m1 = mean(plasticDists);
const m2 = mean(innateDists);
const sPooled = Math.sqrt(((std(plasticDists) ** 2) + (std(innateDists) ** 2)) / 2);
const cohensD = sPooled > 0 ? (m2 - m1) / sPooled : 0;

console.log(`\nStatistical Effect Size (Plastic Synthesis vs Innate Control):`);
console.log(`Cohen's d: ${r3(cohensD)} (${cohensD > 0.8 ? 'LARGE EFFECT SIZE (d > 0.8)' : cohensD > 0.5 ? 'MEDIUM EFFECT' : 'SMALL EFFECT'})`);

console.log(`\nSample Synthesized Logic Across Runs:`);
const allRules = new Set(results.plastic.flatMap((r) => r.writtenRules).concat(results.neurosymbolic.flatMap((r) => r.writtenRules)));
for (const rule of [...allRules].slice(0, 8)) {
  console.log(`  * ${rule}`);
}
console.log(`\nBenchmark completed successfully.\n`);
