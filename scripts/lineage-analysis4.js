#!/usr/bin/env node
// Analysis fixed by docs/research/prereg-inheritance-4.md (with its machine
// form, prereg-inheritance-4.json), written before the run. The unit is the
// population: each population's survival is averaged over its lives, and
// populations are compared across arms and damages (they share world seeds, so
// the comparison is paired by population). Reads the outputs of
// scripts/lineage-selection.js laid out as <dir>/<damage>/<arm>-<pop>.json.
//
// Every test is a one-sided sign-flip permutation on the paired population
// differences: superiority on d (a > b), non-inferiority on d + margin (a is
// not worse than b by more than the margin). An intersection holds only if all
// its parts do; its p is the largest of theirs. Holm runs over the primary
// family. Recovery, (arm - born) / (ceiling - born), is an estimate with a
// bootstrap interval over populations, not a test.
//
//   node scripts/lineage-analysis4.js <dir> [--plan other.json]

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const dir = argv[0];
if (!dir) throw new Error('usage: lineage-analysis4.js <dir> [--plan other.json]');
const planAt = argv.includes('--plan') ? argv[argv.indexOf('--plan') + 1] : new URL('../docs/research/prereg-inheritance-4.json', import.meta.url);
const PLAN = JSON.parse(readFileSync(planAt, 'utf8'));
const { arms: ARMS, late: LATE } = PLAN;
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
const has = (arm) => PLAN.damages.some((d) => rows[d][arm]);

// One number per population: its survival over the given generations.
function byPop([damage, arm], gens) {
  const out = new Map();
  for (const r of rows[damage]?.[arm] ?? []) {
    if (!gens.includes(r.g)) continue;
    if (!out.has(r.pop)) out.set(r.pop, []);
    out.get(r.pop).push(r.alive);
  }
  return new Map([...out].map(([p, xs]) => [p, mean(xs)]));
}

// Seeded generators, so the analysis prints the same numbers every time.
function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// One-sided 95 % t quantiles by degrees of freedom.
const TCRIT = { 7: 1.895, 15: 1.753, 23: 1.714, 31: 1.696, 47: 1.678, 63: 1.669 };

// Paired population differences a - b (shifted by the margin for
// non-inferiority): mean, one-sided sign-flip p, t and the one-sided 95 % lower
// bound of the unshifted difference.
function compare(h) {
  const A = byPop(h.a, h.gens);
  const B = byPop(h.b, h.gens);
  const d = [...A.keys()].filter((p) => B.has(p)).sort((x, y) => x - y).map((p) => A.get(p) - B.get(p));
  if (d.length < 2) return null;
  const shift = h.kind === 'noninferiority' ? h.margin : 0;
  const x = d.map((v) => v + shift);
  const m = mean(x);
  const rnd = mulberry(PLAN.permutationSeed);
  let atLeast = 0;
  for (let k = 0; k < PLAN.permutations; k++) {
    let s = 0;
    for (const v of x) s += rnd() < 0.5 ? -v : v;
    if (s / x.length >= m - 1e-12) atLeast += 1;
  }
  const se = sd(d) / Math.sqrt(d.length);
  const diff = mean(d);
  return {
    pops: d.length, diff, ahead: d.filter((v) => v > 0).length, behind: d.filter((v) => v < 0).length,
    p: (atLeast + 1) / (PLAN.permutations + 1), t: diff / se, lower: diff - (TCRIT[d.length - 1] ?? 1.645) * se,
  };
}

// Recovery of arm in damage: (arm - born) / (ceiling - born), populations paired
// across all three; interval by resampling populations.
function recovery(damage, arm, gens) {
  const A = byPop([damage, arm], gens);
  const B = byPop([damage, 'born'], gens);
  const C = byPop([PLAN.ceiling.damage, PLAN.ceiling.arm], gens);
  const pops = [...A.keys()].filter((p) => B.has(p) && C.has(p));
  if (pops.length < 2) return null;
  const ratio = (ps) => (mean(ps.map((p) => A.get(p))) - mean(ps.map((p) => B.get(p))))
    / (mean(ps.map((p) => C.get(p))) - mean(ps.map((p) => B.get(p))));
  const rnd = mulberry(PLAN.bootstrapSeed);
  const draws = [];
  for (let k = 0; k < PLAN.bootstrap; k++) draws.push(ratio(pops.map(() => pops[Math.floor(rnd() * pops.length)])));
  draws.sort((x, y) => x - y);
  const q = (f) => draws[Math.min(draws.length - 1, Math.floor(f * draws.length))];
  return { pops: pops.length, r: ratio(pops), lo: q(0.025), hi: q(0.975) };
}

console.log('lives per damage and arm');
for (const damage of PLAN.damages) {
  console.log(`  ${damage.padEnd(8)} ${ARMS.filter((a) => rows[damage][a]).map((a) => `${a} ${rows[damage][a].length}`).join('  ') || '(none)'}`);
}
for (const damage of PLAN.damages) {
  const present = ARMS.filter((a) => rows[damage][a]);
  if (!present.length) continue;
  console.log(`\nsurvival by generation, ${damage}`);
  for (let g = 0; g < 6; g++) {
    console.log(`  gen ${g}  ${present.map((a) => `${a} ${mean(rows[damage][a].filter((r) => r.g === g).map((r) => r.alive)).toFixed(3)}`).join('  ')}`);
  }
  console.log(`  gens ${LATE[0]}-${LATE.at(-1)}`);
  const prefix = PLAN.repairPrefix[damage];
  for (const a of present) {
    const r = rows[damage][a].filter((x) => LATE.includes(x.g));
    const causes = {};
    for (const x of r) causes[x.cause] = (causes[x.cause] ?? 0) + 1;
    const carries = prefix ? `  carries ${prefix}* ${(r.filter((x) => [...x.inherited, ...x.own].some((id) => id.startsWith(prefix))).length / r.length).toFixed(3)}` : '';
    console.log(`    ${a.padEnd(12)} alive ${mean(r.map((x) => x.alive)).toFixed(3)}  lived ${mean(r.map((x) => x.lived)).toFixed(0)}  eaten ${mean(r.map((x) => x.eaten)).toFixed(2)}  inherited lines ${mean(r.map((x) => x.inherited.length)).toFixed(2)}  own ${mean(r.map((x) => x.own.length)).toFixed(2)}${carries}  deaths ${JSON.stringify(causes)}`);
  }
}

console.log(`\nrecovery, gens ${LATE[0]}-${LATE.at(-1)}: (arm - born) / (${PLAN.ceiling.damage} ${PLAN.ceiling.arm} - born), 95 % bootstrap over populations (${PLAN.bootstrap} resamples)`);
for (const [damage, arms] of Object.entries(PLAN.recovery)) {
  for (const arm of arms) {
    const r = recovery(damage, arm, LATE);
    console.log(`  ${damage.padEnd(8)} ${arm.padEnd(12)} ${r ? `${r.r.toFixed(2)} [${r.lo.toFixed(2)}, ${r.hi.toFixed(2)}] over ${r.pops} populations` : 'missing data'}`);
  }
}

console.log(`\nhypotheses (unit: population; one-sided sign-flip permutation, ${PLAN.permutations} draws; non-inferiority tested on difference + margin)`);
const label = (h) => `${h.a.join(' ')} ${h.kind === 'superiority' ? '>' : 'not worse than'} ${h.b.join(' ')}${h.kind === 'noninferiority' ? ` by ${h.margin}` : ''}, gens ${h.gens.join(',')}`;
const results = [];
for (const h of PLAN.hypotheses) {
  // An arm the preregistration allows to be dropped (the gate, if the pilot finds no threshold).
  if (h.needs && !has(h.needs)) { results.push({ ...h, dropped: true }); continue; }
  if (h.kind === 'intersection') {
    const parts = h.parts.map((p) => ({ ...p, ...compare(p) }));
    if (parts.some((p) => p.p === undefined)) { results.push({ ...h, missing: true }); continue; }
    results.push({ ...h, parts, p: Math.max(...parts.map((p) => p.p)) });
  } else {
    const c = compare(h);
    results.push(c ? { ...h, ...c } : { ...h, missing: true });
  }
}
// Holm over the primary hypotheses that ran.
const primary = results.filter((h) => h.family === 'primary' && !h.dropped && !h.missing).sort((x, y) => x.p - y.p);
let stop = false;
primary.forEach((h, i) => {
  h.alpha = PLAN.alpha / (primary.length - i);
  if (stop || h.p >= h.alpha) { stop = true; h.ok = false; } else h.ok = true;
});
for (const h of results) {
  if (h.family !== 'primary' && !h.dropped && !h.missing) { h.alpha = PLAN.alpha; h.ok = h.p < PLAN.alpha; }
}
const line = (h) => `diff ${fmt(h.diff)}, ${h.ahead}/${h.behind} of ${h.pops} populations ahead/behind, t ${h.t.toFixed(2)}, lower bound ${fmt(h.lower)}, p ${h.p.toFixed(4)}`;
for (const h of results) {
  const head = `  ${h.id.padEnd(4)} ${h.family.padEnd(9)}`;
  if (h.dropped) { console.log(`${head} dropped: no ${h.needs} runs (as the preregistration allows)`); continue; }
  if (h.missing) { console.log(`${head} missing data`); continue; }
  const verdict = `${h.family === 'primary' ? ` (Holm alpha ${h.alpha.toFixed(3)})` : ''} -> ${h.ok ? 'SUPPORTED' : 'NOT SUPPORTED'}`;
  if (h.kind === 'intersection') {
    console.log(`${head} all of: p = largest ${h.p.toFixed(4)}${verdict}`);
    for (const p of h.parts) console.log(`         ${p.id.padEnd(4)} ${label(p)}: ${line(p)}${p.p < h.alpha ? '' : '  (fails)'}`);
  } else {
    console.log(`${head} ${label(h)}: ${line(h)}${verdict}`);
  }
}
