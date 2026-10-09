#!/usr/bin/env node
// Analysis fixed by docs/research/prereg-inheritance-2.md, written before the
// run. The unit is the population: each population's survival is averaged over
// its lives, and populations are compared across arms (they share world seeds,
// so the comparison is paired by population). Reads the outputs of
// scripts/lineage-selection.js laid out as <dir>/<damage>/<arm>-<pop>.json.
//
//   node scripts/lineage-analysis2.js <dir>

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('usage: lineage-analysis2.js <dir>');

const PLAN = JSON.parse(readFileSync(new URL('../docs/research/prereg-inheritance-2.json', import.meta.url), 'utf8'));
const ARMS = ['born', 'learn', 'inherit', 'inheritAny'];
const LATE = [3, 4, 5];
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const fmt = (x) => (x >= 0 ? ' ' : '') + x.toFixed(3);

const rows = {};
for (const damage of PLAN.damages) {
  rows[damage] = {};
  const d = join(dir, damage);
  if (!existsSync(d)) continue;
  const files = readdirSync(d);
  for (const arm of ARMS) {
    const fs = files.filter((f) => f.startsWith(`${arm}-`) && f.endsWith('.json'));
    if (fs.length) rows[damage][arm] = fs.flatMap((f) => JSON.parse(readFileSync(join(d, f), 'utf8')));
  }
}

// One number per population: its survival over the given generations.
function byPop(damage, arm, gens) {
  const out = new Map();
  for (const r of rows[damage][arm] ?? []) {
    if (!gens.includes(r.g)) continue;
    if (!out.has(r.pop)) out.set(r.pop, []);
    out.get(r.pop).push(r.alive);
  }
  return new Map([...out].map(([p, xs]) => [p, mean(xs)]));
}

// Seeded generator for the permutation test, so the analysis prints the same p every time.
function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Paired population differences a - b: mean, sign-flip permutation p (one-sided,
// a > b), t over populations and its one-sided 95 % lower bound.
function compare(damage, a, b, gens) {
  const A = byPop(damage, a, gens);
  const B = byPop(damage, b, gens);
  const d = [...A.keys()].filter((p) => B.has(p)).sort((x, y) => x - y).map((p) => A.get(p) - B.get(p));
  if (d.length < 2) return null;
  const m = mean(d);
  const se = sd(d) / Math.sqrt(d.length);
  const rnd = mulberry(PLAN.permutationSeed);
  let atLeast = 0;
  for (let k = 0; k < PLAN.permutations; k++) {
    let s = 0;
    for (const x of d) s += rnd() < 0.5 ? -x : x;
    if (s / d.length >= m - 1e-12) atLeast += 1;
  }
  const tcrit = TCRIT[d.length - 1] ?? 1.645;
  return { pops: d.length, diff: m, ahead: d.filter((x) => x > 0).length, behind: d.filter((x) => x < 0).length, p: (atLeast + 1) / (PLAN.permutations + 1), t: m / se, lower: m - tcrit * se };
}
// One-sided 95 % t quantiles by degrees of freedom.
const TCRIT = { 15: 1.753, 23: 1.714, 31: 1.696, 47: 1.678, 63: 1.669 };

console.log('lives per damage and arm');
for (const damage of PLAN.damages) {
  console.log(`  ${damage.padEnd(10)} ${ARMS.map((a) => `${a} ${rows[damage][a]?.length ?? 0}`).join('  ')}`);
}
for (const damage of PLAN.damages) {
  console.log(`\nsurvival by generation, ${damage}`);
  for (let g = 0; g < 6; g++) {
    const cells = ARMS.filter((a) => rows[damage][a]).map((a) => `${a} ${mean(rows[damage][a].filter((r) => r.g === g).map((r) => r.alive)).toFixed(3)}`);
    console.log(`  gen ${g}  ${cells.join('  ')}`);
  }
  console.log(`  gens 3-5`);
  for (const a of ARMS.filter((x) => rows[damage][x])) {
    const r = rows[damage][a].filter((x) => LATE.includes(x.g));
    const causes = {};
    for (const x of r) causes[x.cause] = (causes[x.cause] ?? 0) + 1;
    const repair = r.filter((x) => [...x.inherited, ...x.own].some((id) => id.startsWith(`${PLAN.repairPrefix[damage] ?? '-'}`))).length / r.length;
    console.log(`    ${a.padEnd(10)} alive ${mean(r.map((x) => x.alive)).toFixed(3)}  lived ${mean(r.map((x) => x.lived)).toFixed(0)}  eaten ${mean(r.map((x) => x.eaten)).toFixed(2)}  inherited lines ${mean(r.map((x) => x.inherited.length)).toFixed(2)}  own ${mean(r.map((x) => x.own.length)).toFixed(2)}  carries ${PLAN.repairPrefix[damage] ?? '-'}* ${repair.toFixed(3)}  deaths ${JSON.stringify(causes)}`);
  }
}

console.log(`\nhypotheses (unit: population; one-sided sign-flip permutation, ${PLAN.permutations} draws; non-inferiority by the one-sided 95 % t lower bound)`);
const results = [];
for (const h of PLAN.hypotheses) {
  const c = compare(h.damage, h.a, h.b, h.gens);
  if (!c) { console.log(`  ${h.id} missing data`); continue; }
  results.push({ ...h, ...c });
}
// Holm over the primary family.
const primary = results.filter((h) => h.family === 'primary' && h.kind === 'superiority').sort((x, y) => x.p - y.p);
primary.forEach((h, i) => { h.alpha = PLAN.alpha / (primary.length - i); });
let stop = false;
for (const h of primary) { if (stop || h.p >= h.alpha) { stop = true; h.holmFail = true; } }
for (const h of results) {
  const ok = h.kind === 'superiority'
    ? (h.family === 'primary' ? !h.holmFail : h.p < PLAN.alpha)
    : h.lower > -PLAN.margin;
  const test = h.kind === 'superiority'
    ? `p ${h.p.toFixed(4)}${h.alpha ? ` (Holm alpha ${h.alpha.toFixed(3)})` : ''}`
    : `lower bound ${fmt(h.lower)} vs margin -${PLAN.margin}`;
  console.log(`  ${h.id.padEnd(4)} ${h.family.padEnd(9)} ${h.damage}: ${h.a} ${h.kind === 'superiority' ? '>' : 'not worse than'} ${h.b}, gens ${h.gens.join(',')}: diff ${fmt(h.diff)}, ${h.ahead}/${h.behind} of ${h.pops} populations ahead/behind, t ${h.t.toFixed(2)}, ${test} -> ${ok ? 'SUPPORTED' : 'NOT SUPPORTED'}`);
}
