#!/usr/bin/env node
// Analysis fixed by docs/research/prereg-leaps.md, written before the run.
// Reads the --json outputs of scripts/game-world.js for the three arms
// (sham.json, sym.json, up.json in <dir>); maps pair across arms by seed.
//
// A "line" is one leap (or, in the sham arm, one birth marked as leaping with
// the same draws and nothing changed) and everyone descending from it. A line
// "takes" if its first carrier leaves at least one young (born > 1).
//
// Tests are one-sided permutations that swap the two arms within each map
// (20 000 draws, seed 2028): for shares of lines, the statistic is the pooled
// share in one arm minus the other's; for map means, the mean paired difference.
// Holm over the primary family.
//
//   node scripts/leap-analysis.js <dir>

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('usage: leap-analysis.js <dir>');
const ARMS = ['sham', 'sym', 'up'];
const ORGANS = ['size', 'muscle', 'brain', 'gut', 'eyes', 'antennae'];
const COSTLY = ['brain', 'muscle', 'size'];
const CHEAP = ['antennae', 'eyes'];
const PERM = 20000;
const ALPHA = 0.05;

const data = Object.fromEntries(ARMS.map((a) => [a, JSON.parse(readFileSync(join(dir, `${a}.json`), 'utf8'))]));
const YEARS = data.sham.years;
const bySeed = (a) => Object.fromEntries(data[a].results.map((r) => [r.seed, r]));
const maps = Object.keys(bySeed('sham')).filter((s) => ARMS.every((a) => bySeed(a)[s])).sort((x, y) => x - y);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

const linesOf = (a, seed, keep = () => true) => Object.values(bySeed(a)[seed].lines ?? {}).filter((l) => l.leapt && keep(l));
const costly = (l) => Object.keys(l.leapt).some((k) => COSTLY.includes(k));
const cheap = (l) => Object.keys(l.leapt).every((k) => CHEAP.includes(k));
const takes = (l) => (l.born > 1 ? 1 : 0);

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Share of lines that take, arm a minus arm b, lines pooled; permutation swaps
// the two arms' lines map by map. H1: a < b (sign -1) or a > b (+1).
function shareTest(a, b, keep, sign) {
  const per = maps.map((s) => ({ A: linesOf(a, s, keep).map(takes), B: linesOf(b, s, keep).map(takes) }));
  const stat = (swap) => {
    let ta = 0, na = 0, tb = 0, nb = 0;
    per.forEach((m, i) => {
      const [x, y] = swap?.[i] ? [m.B, m.A] : [m.A, m.B];
      ta += x.reduce((u, v) => u + v, 0); na += x.length; tb += y.reduce((u, v) => u + v, 0); nb += y.length;
    });
    return { d: ta / na - tb / nb, na, nb, pa: ta / na, pb: tb / nb };
  };
  const obs = stat(null);
  const rnd = mulberry(2028);
  let atLeast = 0;
  for (let k = 0; k < PERM; k++) {
    const d = stat(per.map(() => rnd() < 0.5)).d;
    if (sign * d >= sign * obs.d - 1e-12) atLeast++;
  }
  return { ...obs, p: (atLeast + 1) / (PERM + 1) };
}

// Mean over organs of the living's genes at the end, per map; a minus b.
function geneOf(r) {
  const end = r.rows.filter((x) => x.year === YEARS && x.traits);
  if (!end.length) return NaN;
  return mean(ORGANS.map((k) => {
    const n = end.reduce((t, x) => t + x.traits.n, 0);
    return end.reduce((t, x) => t + x.traits[`gene.${k}`] * x.traits.n, 0) / n;
  }));
}
// `margin` (non-inferiority): tested on the difference plus it.
function mapTest(a, b, f, sign, margin = 0) {
  const A = bySeed(a), B = bySeed(b);
  const d = maps.map((s) => f(A[s]) - f(B[s]) + margin).filter(Number.isFinite);
  const m = mean(d);
  const rnd = mulberry(2028);
  let atLeast = 0;
  for (let k = 0; k < PERM; k++) {
    let s = 0;
    for (const v of d) s += rnd() < 0.5 ? -v : v;
    if (sign * s / d.length >= sign * m - 1e-12) atLeast++;
  }
  return { d: m - margin, maps: d.length, ahead: d.filter((v) => v > margin).length, behind: d.filter((v) => v < margin).length, p: (atLeast + 1) / (PERM + 1) };
}

const popOf = (r) => mean(r.rows.filter((x) => x.year >= 2).map((x) => x.mean)) * (new Set(r.rows.map((x) => x.nest)).size);
const endShare = (r) => {
  const end = r.rows.filter((x) => x.year === YEARS);
  const n = end.reduce((t, x) => t + (x.leaps?.n ?? 0), 0);
  return n ? end.reduce((t, x) => t + (x.leaps?.carriers ?? 0), 0) / n : 0;
};

console.log(`maps ${maps.length}, years ${YEARS}\n`);
console.log('arm   lines  take   peak≥5  living from a line at the end  population (years 2+)  gene means at the end (' + ORGANS.join('/') + ')');
for (const a of ARMS) {
  const ls = maps.flatMap((s) => linesOf(a, s));
  const genes = ORGANS.map((k) => mean(maps.map((s) => {
    const end = bySeed(a)[s].rows.filter((x) => x.year === YEARS && x.traits);
    return end.length ? mean(end.map((x) => x.traits[`gene.${k}`])) : NaN;
  }).filter(Number.isFinite)).toFixed(3)).join('/');
  console.log(`${a.padEnd(5)} ${String(ls.length).padStart(5)}  ${mean(ls.map(takes)).toFixed(3)}  ${String(ls.filter((l) => l.peak >= 5).length).padStart(6)}  ${(100 * mean(maps.map((s) => endShare(bySeed(a)[s])))).toFixed(1).padStart(28)} %  ${mean(maps.map((s) => popOf(bySeed(a)[s]))).toFixed(1).padStart(20)}  ${genes}`);
}

const H = [
  { id: 'L1', family: 'secondary', what: 'sym lines take less often than sham lines (most leaps are a burden)', run: () => shareTest('sym', 'sham', () => true, -1) },
  { id: 'L2', family: 'primary', what: 'sym lines leaping in brain, muscle or size take less often than the same marks in sham', run: () => shareTest('sym', 'sham', costly, -1) },
  { id: 'L3', family: 'primary', what: 'up: the living\'s mean organ gene at the end is higher than in sham', run: () => mapTest('up', 'sham', geneOf, 1) },
  { id: 'L4', family: 'secondary', what: 'up lines take less often than sham lines', run: () => shareTest('up', 'sham', () => true, -1) },
  { id: 'L5', family: 'secondary', what: 'up lines leaping in brain, muscle or size take less often than the same marks in sham', run: () => shareTest('up', 'sham', costly, -1) },
  { id: 'L6', family: 'primary', what: 'sym lines leaping only in antennae or eyes take more often than sym lines leaping in brain, muscle or size', run: () => {
    // Within one arm: cheap vs costly lines, permutation of the labels within each map.
    const per = maps.map((s) => ({ c: linesOf('sym', s, cheap).map(takes), x: linesOf('sym', s, costly).map(takes) }));
    const stat = (perm) => {
      let tc = 0, nc = 0, tx = 0, nx = 0;
      per.forEach((m, i) => {
        let all = [...m.c.map((v) => [v, 'c']), ...m.x.map((v) => [v, 'x'])];
        if (perm) { const labels = all.map((e) => e[1]); for (let j = labels.length - 1; j > 0; j--) { const r = Math.floor(perm() * (j + 1)); [labels[j], labels[r]] = [labels[r], labels[j]]; } all = all.map((e, j) => [e[0], labels[j]]); }
        for (const [v, l] of all) if (l === 'c') { tc += v; nc++; } else { tx += v; nx++; }
      });
      return { d: tc / nc - tx / nx, pa: tc / nc, pb: tx / nx, na: nc, nb: nx };
    };
    const obs = stat(null);
    const rnd = mulberry(2028);
    let atLeast = 0;
    for (let k = 0; k < PERM; k++) if (stat(rnd).d >= obs.d - 1e-12) atLeast++;
    return { ...obs, p: (atLeast + 1) / (PERM + 1) };
  } },
  { id: 'L7', family: 'secondary', what: 'sym: population (years 2+) not lower than sham by more than 3 Fagis per map', run: () => mapTest('sym', 'sham', popOf, 1, 3) },
];

const results = H.map((h) => ({ ...h, ...h.run() }));
const primary = results.filter((h) => h.family === 'primary').sort((x, y) => x.p - y.p);
let stop = false;
primary.forEach((h, i) => { h.alpha = ALPHA / (primary.length - i); h.ok = !stop && h.p < h.alpha; if (!h.ok) stop = true; });
for (const h of results) if (h.family !== 'primary') { h.alpha = ALPHA; h.ok = h.p < ALPHA; }
console.log(`\nhypotheses (one-sided permutations, ${PERM} draws; Holm over the primary family)`);
for (const h of results) {
  const detail = h.pa != null
    ? `${h.pa.toFixed(3)} (${h.na} lines) vs ${h.pb.toFixed(3)} (${h.nb})`
    : `mean paired difference ${h.d >= 0 ? '+' : ''}${h.d.toFixed(4)}, ${h.ahead}/${h.behind} of ${h.maps} maps`;
  console.log(`  ${h.id} ${h.family.padEnd(9)} ${h.what}: ${detail}, p ${h.p.toFixed(4)} (alpha ${h.alpha.toFixed(3)}) -> ${h.ok ? 'SUPPORTED' : 'NOT SUPPORTED'}`);
}
