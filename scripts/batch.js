// Test bench: the SAME map, the same resources, several Fagis.
//
// Runs the simulation without a browser (instinct only, no decision API) and
// compares the sessions with each other: how long they live, what they die of,
// what they spend their time on and where they wander. It shows whether her
// behaviour is stable or whether every game is a lottery.
//
// Randomness comes in three separate streams, each with its own seed:
//   map    → where everything is (and the initial wind). Same in all runs.
//   world  → wind and falling fruit. Same in all runs unless --world-varies.
//   Fagi   → her random choices (initial heading, turns, memory drift).
//            Different in each run: that is what is being tested.
// With the same Fagi seed twice the session comes out identical (--check).
//
//   node scripts/batch.js --map-seed 42 --runs 20 --duration 900
//   node scripts/batch.js --map-seed 42 --runs 20 --json out.json
//
// The pieces live in batch/: arguments, seeded randomness, a single run,
// statistics and the report. Here they are only run and counted.

import { args, applySets } from './batch/args.js';
import { runOnce } from './batch/run.js';
import { report } from './batch/report.js';
import { round } from './batch/stats.js';
import { writeFileSync } from 'node:fs';

// --- main -------------------------------------------------------------------

const opts = args(process.argv.slice(2));
applySets(opts.sets);
const runs = [];
const t0 = Date.now();
for (let i = 0; i < opts.runs; i++) {
  const r = runOnce(opts, opts.seed0 + i);
  runs.push(r);
  process.stderr.write(`\rrun ${i + 1}/${opts.runs}`);
}
process.stderr.write(`\r${' '.repeat(30)}\r`);

console.log(report(opts, runs));
const wall = Date.now() - t0;
const steps = runs.reduce((a, r) => a + r.lived / opts.dt, 0);
console.log(`\n(${round(wall / 1000)}s real time · ${round((wall / steps) * 1000, 1)} µs per simulation step)`);

if (opts.check) {
  const another = runOnce(opts, opts.seed0);
  const ok = another.fingerprint === runs[0].fingerprint && JSON.stringify(another.sequence) === JSON.stringify(runs[0].sequence);
  console.log(ok
    ? `check: repeating seed ${opts.seed0} gives the same session ✓`
    : `check: repeating seed ${opts.seed0} gives a DIFFERENT session ✗ — there is randomness outside the seeds`);
  if (!ok) process.exitCode = 1;
}

if (opts.json) {
  writeFileSync(opts.json, JSON.stringify({ opts, runs }, null, 1));
  console.log(`data in ${opts.json}`);
}
