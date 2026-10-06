#!/usr/bin/env node
// Analysis fixed by docs/research/prereg-lineage-inheritance.md, written
// before the run. Reads the outputs of scripts/lineage-selection.js (one JSON
// file per arm and population: <dir>/<arm>-<pop>.json) and, for H4, of
// scripts/calibrate-world.js (<dir>/h4-<seed0>.json).
//
//   node scripts/lineage-analysis.js <dir>

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('usage: lineage-analysis.js <dir>');

const ARMS = ['born', 'learn', 'inherit', 'inheritAny'];
const files = readdirSync(dir);
const rows = {};
for (const arm of ARMS) {
  rows[arm] = files.filter((f) => f.startsWith(`${arm}-`) && f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
}
const key = (r) => `${r.pop}-${r.g}-${r.i}`;
const late = (arm) => rows[arm].filter((r) => r.g >= 3);
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

// Exact binomial tail: P(X >= k) for X ~ Bin(n, 1/2).
function upper(k, n) {
  let p = 0;
  let c = 1;
  for (let j = 0; j <= n; j++) {
    if (j >= k) p += c;
    c = (c * (n - j)) / (j + 1);
  }
  return p / 2 ** n;
}

// Paired by world slot: lives where a lived and b died, and the reverse.
function paired(a, b) {
  const other = new Map(late(b).map((r) => [key(r), r]));
  let better = 0;
  let worse = 0;
  let n = 0;
  for (const r of late(a)) {
    const o = other.get(key(r));
    if (!o) continue;
    n += 1;
    if (r.alive > o.alive) better += 1;
    if (r.alive < o.alive) worse += 1;
  }
  return { n, better, worse, p: upper(better, better + worse), diff: (better - worse) / n };
}

const fmt = (x) => x.toFixed(3);
console.log(`lives per arm: ${ARMS.map((a) => `${a} ${rows[a].length}`).join(', ')}`);
console.log('\nsurvival by generation');
for (let g = 0; g < 6; g++) {
  console.log(`  gen ${g}  ${ARMS.map((a) => `${a} ${fmt(mean(rows[a].filter((r) => r.g === g).map((r) => r.alive)))}`).join('  ')}`);
}
console.log('\ngenerations 3-5');
for (const a of ARMS) {
  const r = late(a);
  const dusk = r.filter((x) => [...x.inherited, ...x.own].some((id) => id.startsWith('dusk-before-'))).length / r.length;
  console.log(`  ${a.padEnd(10)} alive ${fmt(mean(r.map((x) => x.alive)))}  lived ${mean(r.map((x) => x.lived)).toFixed(0)}  eaten ${mean(r.map((x) => x.eaten)).toFixed(2)}  carries dusk-before-* ${fmt(dusk)}`);
}

const tests = [
  ['H1', 'inherit', 'learn', 'primary'],
  ['H2', 'learn', 'born', 'secondary'],
  ['H3', 'inherit', 'inheritAny', 'secondary'],
];
console.log('\nhypotheses (one-sided exact sign test on discordant pairs, alpha 0.05)');
for (const [h, a, b, kind] of tests) {
  const t = paired(a, b);
  console.log(`  ${h} ${kind.padEnd(9)} ${a} > ${b}: ${t.better} better / ${t.worse} worse of ${t.n}, diff ${fmt(t.diff)}, p ${t.p.toFixed(4)} -> ${t.p < 0.05 ? 'SUPPORTED' : 'NOT SUPPORTED'}`);
}

// H4: intact program, single lives. Non-inferiority of learning (reserves +
// darkTrials + exploreByState) against born, margin 0.05.
const h4 = files.filter((f) => f.startsWith('h4-') && f.endsWith('.json'));
if (h4.length) {
  const born = [];
  const learnt = [];
  for (const f of h4) {
    const o = JSON.parse(readFileSync(join(dir, f), 'utf8')).out;
    born.push(...o.born.aliveBySeed);
    learnt.push(...o.reservesNight.aliveBySeed);
  }
  const d = learnt.map((x, i) => x - born[i]);
  const m = mean(d);
  const sd = Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (d.length - 1));
  const lower = m - 1.645 * sd / Math.sqrt(d.length);
  console.log(`  H4 secondary learning not worse than born by 0.05 (intact, ${d.length} lives): diff ${fmt(m)}, one-sided 95% lower bound ${fmt(lower)} -> ${lower > -0.05 ? 'SUPPORTED' : 'NOT SUPPORTED'}`);
}
