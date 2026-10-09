#!/usr/bin/env node
// Sensitivity of the preregistered inheritance study (docs/research/prereg-lineage-results.md)
// to its unit: daughters of one population share mothers, so the paired lives
// are not independent. Here each population is one number (its survival in the
// given generations) and the 32 populations are compared across arms.
// Exploratory, written after the run.
//
//   node scripts/lineage-by-population.js research/prereg-lineage

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('usage: lineage-by-population.js <dir>');
const ARMS = ['born', 'learn', 'inherit', 'inheritAny'];
const files = readdirSync(dir);
const rows = {};
for (const a of ARMS) rows[a] = files.filter((f) => f.startsWith(`${a}-`) && f.endsWith('.json')).flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const pops = [...new Set(rows.born.map((r) => r.pop))].sort((a, b) => a - b);

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function compare(a, b, gens) {
  const surv = (arm, p) => mean(rows[arm].filter((r) => r.pop === p && gens.includes(r.g)).map((r) => r.alive));
  const d = pops.map((p) => surv(a, p) - surv(b, p));
  const m = mean(d);
  const se = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (d.length - 1)) / Math.sqrt(d.length);
  const rnd = mulberry(1);
  let atLeast = 0;
  const N = 20000;
  for (let k = 0; k < N; k++) {
    let s = 0;
    for (const x of d) s += rnd() < 0.5 ? -x : x;
    if (s / d.length >= m - 1e-12) atLeast += 1;
  }
  return `diff ${m.toFixed(3)}, ${d.filter((x) => x > 0).length} ahead / ${d.filter((x) => x < 0).length} behind of ${d.length}, t ${(m / se).toFixed(2)}, one-sided 95% lower bound ${(m - 1.696 * se).toFixed(3)}, permutation p ${((atLeast + 1) / (N + 1)).toFixed(4)}`;
}

console.log('gens 3-5, unit = population');
for (const [h, a, b] of [['H1', 'inherit', 'learn'], ['H2', 'learn', 'born'], ['H3', 'inherit', 'inheritAny'], ['--', 'inherit', 'born']]) {
  console.log(`  ${h} ${a} > ${b}: ${compare(a, b, [3, 4, 5])}`);
}
console.log('\nH1 by generation');
for (let g = 1; g < 6; g++) console.log(`  gen ${g}: ${compare('inherit', 'learn', [g])}`);
