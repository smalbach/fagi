// Step 0 of docs/research/plan-codigo-cultural.md (step 1 of
// docs/research/plan-evolucion-de-reglas.md): does selection have force?
//
//   node research/code-culture/seeded.js --seeded good|bad --select tournament|random
//        [--lineages 10] [--generations 20] [--size 30] [--carriers 3] [--T 3]
//        [--group evo] [--jobs 16] [--tag name]
//
// Nobody learns and nobody judges a line (CONDUCT.learn 0, CONDUCT.inherit 0):
// in generation 0, `carriers` of the `size` Fagis of each lineage are born
// with the seeded lines and the rest with none; every daughter is born with
// exactly the lines of her mother. Only who becomes a mother can change how
// many carry them.
//
//   good: the two lines of caution (taste-novel, leave-harmed-mostly)
//   bad:  "never eat anything new" (leave-novel)
//
// Mothers. `tournament`: for each daughter, T of the generation before drawn
// without replacement; the mother is the one that lived longest, then (ties,
// decided before running) the one that ate most, then the first drawn.
// `random`: any of them, which leaves drift alone.
//
// Each life is a world of its own (world n = lineage·G·K + generation·K + k),
// the same n in every condition, so conditions are compared on the same
// worlds. Resumable: every life is its own process and file.

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { rng } from '../../scripts/batch/random.js';
import { FOOD_FAMILIES } from '../adaptive-decision/foodworlds.js';
import { CAUTION_LINES } from '../../src/learned/conduct.js';

export const SEEDS = {
  good: CAUTION_LINES,
  bad: [{ id: 'leave-novel', if: { novel: true }, do: 'leave' }],
};

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);
const SEEDED = opt('--seeded', 'good');
const SELECT = opt('--select', 'tournament');
const R = Number(opt('--lineages', 10));
const G = Number(opt('--generations', 20));
const K = Number(opt('--size', 30));
const C = Number(opt('--carriers', 3));
const T = Number(opt('--T', 3));
const GROUP = opt('--group', 'evo');
const JOBS = Number(opt('--jobs', 16));
const TAG = opt('--tag', `${SEEDED}-${SELECT}`);
if (!SEEDS[SEEDED]) throw new Error(`unknown --seeded ${SEEDED}`);
if (!['tournament', 'random'].includes(SELECT)) throw new Error(`unknown --select ${SELECT}`);

const OUT = `research/results/code-culture/seeded/${TAG}`;
const BATTERY = 'research/adaptive-decision/battery.js';
const run = promisify(execFile);

const worldOf = (r, g, k) => r * G * K + g * K + k;
const familyOf = (n) => FOOD_FAMILIES[n % FOOD_FAMILIES.length];
const fileOf = (r, g, k) => `${OUT}/r${r}-g${g}-k${k}.json`;
// Which of the generation-0 Fagis carry: spread over k so the families take turns among them.
const carrierIn = (k) => k % Math.floor(K / C) === 0 && k / Math.floor(K / C) < C;

// Longer life first, then more eaten; the first drawn on a full tie.
const better = (a, b) => (b.survival - a.survival) || ((b.eaten ?? 0) - (a.eaten ?? 0));

export function mothers(prev, rnd, select = SELECT, t = T) {
  return prev.map(() => {
    if (select === 'random') return prev[Math.floor(rnd() * prev.length)];
    const pool = prev.slice();
    const drawn = [];
    for (let i = 0; i < t; i++) drawn.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    return drawn.reduce((best, x) => (better(best, x) > 0 ? x : best));
  });
}

async function life(r, g, k, born) {
  const file = fileOf(r, g, k);
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  const n = worldOf(r, g, k);
  const sets = { 'CONDUCT.enabled': 1, 'CONDUCT.learn': 0, 'CONDUCT.inherit': 0, 'CONDUCT.born': born };
  const piece = { domain: 'food', controller: 'learned', family: familyOf(n), i: n, group: GROUP, sets };
  await run('node', [BATTERY, '--piece', JSON.stringify(piece), `${file}.tmp`], { maxBuffer: 1 << 26 });
  const out = JSON.parse(readFileSync(`${file}.tmp`, 'utf8'));
  const row = {
    r, g, k, n, family: piece.family, born: born.map((l) => l.id),
    survival: out.survival, alive: out.alive, cause: out.cause, eaten: out.eaten,
  };
  writeFileSync(`${file}.tmp`, JSON.stringify(row));
  renameSync(`${file}.tmp`, file);
  return row;
}

async function pool(tasks) {
  const out = new Array(tasks.length);
  let next = 0;
  await Promise.all(Array.from({ length: JOBS }, async () => {
    while (next < tasks.length) { const i = next++; out[i] = await tasks[i](); }
  }));
  return out;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/run.json`, JSON.stringify({ seeded: SEEDED, lines: SEEDS[SEEDED], select: SELECT, R, G, K, C, T, group: GROUP }, null, 1));
  const lines = SEEDS[SEEDED];
  let prev = null;
  for (let g = 0; g < G; g++) {
    const tasks = [];
    for (let r = 0; r < R; r++) {
      const born = g === 0
        ? Array.from({ length: K }, (_, k) => (carrierIn(k) ? lines : []))
        : mothers(prev[r], rng(9173 + r * 1009 + g * 31)).map((m) => (m.born.length ? lines : []));
      for (let k = 0; k < K; k++) tasks.push(() => life(r, g, k, born[k]));
    }
    const t0 = Date.now();
    const rows = await pool(tasks);
    prev = Array.from({ length: R }, (_, r) => rows.slice(r * K, (r + 1) * K));
    const surv = rows.reduce((a, x) => a + x.survival, 0) / rows.length;
    const freq = rows.filter((x) => x.born.length).length / rows.length;
    console.log(`${TAG} g${g}: carriers ${freq.toFixed(3)}  survival ${surv.toFixed(3)}  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
