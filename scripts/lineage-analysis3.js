#!/usr/bin/env node
// Analysis fixed by docs/research/prereg-inheritance-3.md, written before the
// run. As scripts/lineage-analysis2.js (the population is the unit), but each
// cell is a folder <dir>/<cell>/<arm>-<pop>.json and a hypothesis compares any
// two cells' arms, e.g. "intact-T/inherit" against "intact/born".
//
//   node scripts/lineage-analysis3.js <dir>

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('usage: lineage-analysis3.js <dir>');
const PLAN = JSON.parse(readFileSync(new URL('../docs/research/prereg-inheritance-3.json', import.meta.url), 'utf8'));
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };
const fmt = (x) => (x >= 0 ? ' ' : '') + x.toFixed(3);
const TCRIT = { 31: 1.696 };

const cache = new Map();
function rowsOf(cellArm) {
  if (cache.has(cellArm)) return cache.get(cellArm);
  const [cell, arm] = cellArm.split('/');
  const d = join(dir, cell);
  const rows = existsSync(d) ? readdirSync(d).filter((f) => f.startsWith(`${arm}-`) && f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(join(d, f), 'utf8'))) : [];
  cache.set(cellArm, rows);
  return rows;
}
function byPop(cellArm, gens) {
  const out = new Map();
  for (const r of rowsOf(cellArm)) {
    if (!gens.includes(r.g)) continue;
    if (!out.has(r.pop)) out.set(r.pop, []);
    out.get(r.pop).push(r.alive);
  }
  return new Map([...out].map(([p, xs]) => [p, mean(xs)]));
}
function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function compare(a, b, gens) {
  const A = byPop(a, gens), B = byPop(b, gens);
  const d = [...A.keys()].filter((p) => B.has(p)).sort((x, y) => x - y).map((p) => A.get(p) - B.get(p));
  if (d.length < 2) return null;
  const m = mean(d), se = sd(d) / Math.sqrt(d.length);
  const rnd = mulberry(PLAN.permutationSeed);
  let atLeast = 0;
  for (let k = 0; k < PLAN.permutations; k++) {
    let s = 0;
    for (const x of d) s += rnd() < 0.5 ? -x : x;
    if (s / d.length >= m - 1e-12) atLeast += 1;
  }
  return { pops: d.length, diff: m, ahead: d.filter((x) => x > 0).length, behind: d.filter((x) => x < 0).length, p: (atLeast + 1) / (PLAN.permutations + 1), t: m / se, lower: m - (TCRIT[d.length - 1] ?? 1.645) * se };
}

console.log('survival by generation (and gens 3-5) per cell and arm');
for (const ca of PLAN.cells) {
  const r = rowsOf(ca);
  if (!r.length) { console.log(`  ${ca.padEnd(20)} missing`); continue; }
  const gens = [0, 1, 2, 3, 4, 5].map((g) => mean(r.filter((x) => x.g === g).map((x) => x.alive)).toFixed(3));
  const late = r.filter((x) => x.g >= 3);
  const causes = {};
  for (const x of late) causes[x.cause] = (causes[x.cause] ?? 0) + 1;
  const repair = late.filter((x) => [...x.inherited, ...x.own].some((id) => PLAN.repairPrefixes.some((p) => id.startsWith(p)))).length / late.length;
  console.log(`  ${ca.padEnd(20)} lives ${r.length}  by gen ${gens.join(' ')}  gens 3-5 ${mean(late.map((x) => x.alive)).toFixed(3)}  inherited ${mean(late.map((x) => x.inherited.length)).toFixed(2)}  own ${mean(late.map((x) => x.own.length)).toFixed(2)}  carries a repair line ${repair.toFixed(3)}  deaths ${JSON.stringify(causes)}`);
}

console.log(`\nhypotheses (unit: population; one-sided sign-flip permutation, ${PLAN.permutations} draws; non-inferiority by the one-sided 95 % t lower bound)`);
const results = [];
for (const h of PLAN.hypotheses) {
  const c = compare(h.a, h.b, h.gens);
  if (!c) { console.log(`  ${h.id} missing data`); continue; }
  results.push({ ...h, ...c });
}
// H5 is one claim made of its primary parts: it holds only if every one does
// (an intersection-union test), so each is tested at alpha with no correction.
for (const h of results) {
  const ok = h.kind === 'superiority' ? h.p < PLAN.alpha : h.lower > -PLAN.margin;
  h.ok = ok;
  const test = h.kind === 'superiority' ? `p ${h.p.toFixed(4)}` : `lower bound ${fmt(h.lower)} vs margin -${PLAN.margin}`;
  console.log(`  ${h.id.padEnd(4)} ${h.family.padEnd(9)} ${h.a} ${h.kind === 'superiority' ? '>' : 'not worse than'} ${h.b}, gens ${h.gens.join(',')}: diff ${fmt(h.diff)}, ${h.ahead}/${h.behind} of ${h.pops} populations ahead/behind, t ${h.t.toFixed(2)}, ${test} -> ${ok ? 'SUPPORTED' : 'NOT SUPPORTED'}`);
}
const parts = results.filter((h) => h.family === 'primary');
console.log(`\nH5 (all primary parts: ${parts.map((h) => h.id).join(', ')}) -> ${parts.length === PLAN.hypotheses.filter((h) => h.family === 'primary').length && parts.every((h) => h.ok) ? 'SUPPORTED' : 'NOT SUPPORTED'}`);
