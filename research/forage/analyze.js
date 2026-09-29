// The analysis of the phase 9 evaluation, exactly as the protocol says
// (docs/research/forage-protocol.md). Writes report.md next to the pieces.
//
//   node research/forage/analyze.js [research/results/forage]
//
// The unit is the colony: a colony's outcome is the mean over its sisters
// (nulls skipped). Conditions share seeds, so they are compared colony by
// colony. F3 is about sisters within a colony, and is tested there.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mean, bootstrapCI, paired, holm } from '../stats.js';
import { rng } from '../../scripts/batch/random.js';
import { CONDITIONS, HYPOTHESES, POP_CONDITIONS } from './design.js';

const DIR = process.argv[2] ?? 'research/results/forage';
const data = {};
for (const f of readdirSync(`${DIR}/parts`).filter((x) => x.endsWith('.json'))) {
  const c = f.split('-')[0];
  (data[c] ??= []).push(...JSON.parse(readFileSync(`${DIR}/parts/${f}`, 'utf8')));
}
for (const rows of Object.values(data)) rows.sort((a, b) => a.i - b.i);

const f3 = (v) => (v == null || Number.isNaN(v) ? '–' : (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(3)));
const ci = ([lo, hi]) => `[${f3(lo)}, ${f3(hi)}]`;
const pv = (p) => (p < 0.001 ? '< .001' : p.toFixed(3).replace(/^0/, ''));
const ok = (v) => v != null && !Number.isNaN(v);

// A colony's outcome: the mean over its sisters, or its own field.
function colonyValue(row, outcome) {
  if (outcome in row) return row[outcome];   // a colony's own field, or a population's
  if (!row.sisters) return null;
  const xs = row.sisters.map((s) => s[outcome]).filter(ok);
  return xs.length ? mean(xs) : null;
}

// Paired over the colonies both sides have, skipping nulls.
function pair([ca, oa], [cb, ob]) {
  const byI = new Map((data[cb] ?? []).map((r) => [r.i, r]));
  const a = []; const b = [];
  for (const r of data[ca] ?? []) {
    const other = byI.get(r.i);
    if (!other) continue;
    const x = colonyValue(r, oa);
    const y = colonyValue(other, ob);
    if (!ok(x) || !ok(y)) continue;
    a.push(x); b.push(y);
  }
  return [a, b];
}

// Within-colony association of x and y across sisters: both centered on
// their colony's mean, then correlated. One-sided permutation test that
// shuffles y among the sisters of each colony (never across colonies).
function withinCorr(condition, x, y, { B = 10000, seed = 5 } = {}) {
  const groups = [];
  for (const row of data[condition] ?? []) {
    const pts = row.sisters.filter((s) => ok(s[x]) && ok(s[y])).map((s) => [s[x], s[y]]);
    if (pts.length < 2) continue;
    const mx = mean(pts.map((p) => p[0]));
    const my = mean(pts.map((p) => p[1]));
    groups.push(pts.map(([a, b]) => [a - mx, b - my]));
  }
  const r = (gs) => {
    let sxy = 0; let sxx = 0; let syy = 0;
    for (const g of gs) for (const [a, b] of g) { sxy += a * b; sxx += a * a; syy += b * b; }
    return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
  };
  const observed = r(groups);
  const rnd = rng(seed);
  let beyond = 0;
  for (let k = 0; k < B; k++) {
    const shuffled = groups.map((g) => {
      const ys = g.map((p) => p[1]);
      for (let i = ys.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ys[i], ys[j]] = [ys[j], ys[i]]; }
      return g.map((p, i) => [p[0], ys[i]]);
    });
    if (r(shuffled) >= observed) beyond++;
  }
  return { r: observed, p: (beyond + 1) / (B + 1), n: groups.reduce((a, g) => a + g.length, 0), colonies: groups.length };
}

const lines = [];
const say = (s = '') => lines.push(s);
say('# Explore or come back: results');
say();
say(`Produced by \`node research/forage/analyze.js ${DIR}\`. Protocol: \`docs/research/forage-protocol.md\`.`);
say();
say('## Confirmatory hypotheses');
say();
say('Paired tests: one-sided sign-flip permutation tests of (a + shift) − b > 0 over colonies (10 000 permutations), 95% bootstrap interval of a − b, dz. Within-colony tests: correlation of the two outcomes centered on each colony, one-sided permutation test shuffling within colonies (10 000). Holm over all, α = .05.');
say();
const tests = HYPOTHESES.map((h) => {
  if (h.kind === 'within') {
    const w = withinCorr(h.condition, h.x, h.y);
    return { h, n: `${w.n} sisters, ${w.colonies} colonies`, text: `r = ${f3(w.r)}`, p: w.p };
  }
  const [a, b] = pair(h.a, h.b);
  const d = a.map((x, i) => x - b[i]);
  const t = paired(a.map((x) => x + h.shift), b, { B: 10000, alternative: 'greater' });
  return { h, n: a.length, text: `${f3(mean(a))} vs ${f3(mean(b))}; a − b = ${f3(mean(d))} ${ci(bootstrapCI(d, { seed: 3 }))}; dz ${f3(t.dz)}`, p: t.p };
});
const adj = holm(tests.map((t) => t.p));
say('| test | prediction | n | result | p | Holm p | supported |');
say('|---|---|---|---|---|---|---|');
tests.forEach((t, k) => say(`| ${t.h.id} | ${t.h.says} | ${t.n} | ${t.text} | ${pv(t.p)} | ${pv(adj[k])} | ${adj[k] < 0.05 ? 'yes' : '**no**'} |`));
say();

const OUTCOMES = ['perMin', 'eaten', 'stored', 'alive', 'lived', 'plans', 'exploreShare', 'shareBefore', 'shareAfter', 'fullGood', 'gapAfterFull', 'gapAfterStore', 'spoiled'];
say('## Exploratory: every condition');
say();
say('Colony means, and in brackets the paired difference with `learn` and its 95% bootstrap interval. Not corrected: descriptive.');
say();
say(`| condition | n | ${OUTCOMES.join(' | ')} | deaths |`);
say(`|---|---|${OUTCOMES.map(() => '---').join('|')}|---|`);
for (const c of Object.keys(CONDITIONS)) {
  const rows = (data[c] ?? []).filter((r) => r.sisters);
  if (!rows.length) continue;
  const cells = OUTCOMES.map((o) => {
    const m = mean(rows.map((r) => colonyValue(r, o)).filter(ok));
    if (c === 'learn') return f3(m);
    const [a, b] = pair([c, o], ['learn', o]);
    const d = a.map((x, i) => x - b[i]);
    return d.length ? `${f3(m)} (${f3(mean(d))} ${ci(bootstrapCI(d, { seed: 3 }))})` : f3(m);
  });
  const causes = {};
  for (const r of rows) for (const s of r.sisters) if (s.cause) causes[s.cause] = (causes[s.cause] ?? 0) + 1;
  say(`| ${c} | ${rows.length} | ${cells.join(' | ')} | ${Object.entries(causes).map(([k, n]) => `${k} ${n}`).join(', ') || '–'} |`);
}
say();
const POP_OUTCOMES = ['extinct', 'alive', 'generations', 'hatched', 'explore', 'site', 'memory', 'patience', 'exploreShare'];
if (Object.keys(POP_CONDITIONS).some((c) => data[c]?.length)) {
  say('## Exploratory: populations that breed (F5)');
  say();
  say('Population means; the foraging genes are the mean over the living at the end (founders carry 0). In brackets, the paired difference with `popDurable`.');
  say();
  say(`| condition | n | ${POP_OUTCOMES.join(' | ')} |`);
  say(`|---|---|${POP_OUTCOMES.map(() => '---').join('|')}|`);
  for (const c of Object.keys(POP_CONDITIONS)) {
    const rows = data[c] ?? [];
    if (!rows.length) continue;
    const cells = POP_OUTCOMES.map((o) => {
      const m = mean(rows.map((r) => r[o]).filter(ok));
      if (c === 'popDurable') return f3(m);
      const [a, b] = pair([c, o], ['popDurable', o]);
      const d = a.map((x, i) => x - b[i]);
      return d.length ? `${f3(m)} (${f3(mean(d))} ${ci(bootstrapCI(d, { seed: 3 }))})` : f3(m);
    });
    say(`| ${c} | ${rows.length} | ${cells.join(' | ')} |`);
  }
  say();
}

say('## Exploratory: individuality');
say();
for (const c of ['learn', 'softmax']) {
  const w1 = withinCorr(c, 'early', 'laterShare');
  const w2 = withinCorr(c, 'innate', 'laterShare');
  say(`- \`${c}\`: early experience vs later exploring r = ${f3(w1.r)} (p ${pv(w1.p)}, ${w1.n} sisters); innate noise vs later exploring r = ${f3(w2.r)} (p ${pv(w2.p)}).`);
}
say();

const report = lines.join('\n');
writeFileSync(`${DIR}/report.md`, report);
console.log(report);
