// The analysis of the diversity evaluation, exactly as the protocol says
// (docs/research/diversity-protocol.md). Writes report.md next to the pieces.
//
//   node research/diversity/analyze.js [research/results/diversity]

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mean, bootstrapCI, paired, holm } from '../stats.js';
import { CONDITIONS, HYPOTHESES } from './design.js';

const DIR = process.argv[2] ?? 'research/results/diversity';
const data = {};
for (const f of readdirSync(`${DIR}/parts`).filter((x) => x.endsWith('.json'))) {
  const c = f.split('-')[0];
  (data[c] ??= []).push(...JSON.parse(readFileSync(`${DIR}/parts/${f}`, 'utf8')));
}
for (const rows of Object.values(data)) rows.sort((a, b) => a.i - b.i);

const f3 = (v) => (v == null || Number.isNaN(v) ? '–' : (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(3)));
const ci = ([lo, hi]) => `[${f3(lo)}, ${f3(hi)}]`;
const pv = (p) => (p < 0.001 ? '< .001' : p.toFixed(3).replace(/^0/, ''));

// Paired over the populations both sides have, skipping nulls (an extinct one
// has no adults to judge).
function pair([ca, oa], [cb, ob]) {
  const byI = new Map((data[cb] ?? []).map((r) => [r.i, r]));
  const a = []; const b = [];
  for (const r of data[ca] ?? []) {
    const w = byI.get(r.i)?.[ob];
    if (r[oa] == null || w == null) continue;
    a.push(r[oa]); b.push(w);
  }
  return [a, b];
}

const lines = [];
const say = (s = '') => lines.push(s);
say('# Adaptation and diversity across a change of world: results');
say();
say(`Produced by \`node research/diversity/analyze.js ${DIR}\`. Protocol: \`docs/research/diversity-protocol.md\`.`);
say();
say('## Confirmatory hypotheses');
say();
say('One-sided paired sign-flip permutation tests of (a + shift) − b > 0 (10 000 permutations), 95% bootstrap interval of the mean difference a − b, dz; Holm over the four, α = .05.');
say();
const tests = HYPOTHESES.map((h) => {
  const [a, b] = pair(h.a, h.b);
  const d = a.map((x, i) => x - b[i]);
  return { h, n: a.length, ma: mean(a), mb: mean(b), d, ...paired(a.map((x) => x + h.shift), b, { B: 10000, alternative: 'greater' }) };
});
const adj = holm(tests.map((t) => t.p));
say('| test | prediction | a | b | n | mean a | mean b | a − b [95% CI] | shift | dz | p | Holm p | supported |');
say('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
tests.forEach((t, k) => {
  say(`| ${t.h.id} | ${t.h.says} | ${t.h.a.join('.')} | ${t.h.b.join('.')} | ${t.n} | ${f3(t.ma)} | ${f3(t.mb)} | ${f3(mean(t.d))} ${ci(bootstrapCI(t.d, { seed: 3 }))} | ${t.h.shift} | ${f3(t.dz)} | ${pv(t.p)} | ${pv(adj[k])} | ${adj[k] < 0.05 ? 'yes' : '**no**'} |`);
});
say();

const OUTCOMES = ['extinct', 'alive', 'judgmentBefore', 'judgmentHit', 'judgmentEnd', 'judgmentNew', 'diversityBefore', 'diversityEnd', 'hatchedAfter', 'poisonAfter', 'generations'];
say('## Exploratory: every condition');
say();
say('Means per population, and in brackets the paired difference with `shift` and its 95% bootstrap interval. Not corrected: descriptive.');
say();
say(`| condition | n | ${OUTCOMES.join(' | ')} | deaths after the change |`);
say(`|---|---|${OUTCOMES.map(() => '---').join('|')}|---|`);
for (const c of Object.keys(CONDITIONS)) {
  const rows = data[c] ?? [];
  if (!rows.length) continue;
  const cells = OUTCOMES.map((o) => {
    const m = mean(rows.map((r) => r[o]).filter((v) => v != null));
    if (c === 'shift') return f3(m);
    const [a, b] = pair([c, o], ['shift', o]);
    const d = a.map((x, i) => x - b[i]);
    return d.length ? `${f3(m)} (${f3(mean(d))} ${ci(bootstrapCI(d, { seed: 3 }))})` : f3(m);
  });
  const causes = {};
  for (const r of rows) for (const [k, n] of Object.entries(r.deathsAfter ?? {})) causes[k] = (causes[k] ?? 0) + n;
  say(`| ${c} | ${rows.length} | ${cells.join(' | ')} | ${Object.entries(causes).map(([k, n]) => `${k} ${n}`).join(', ') || '–'} |`);
}
say();

const report = lines.join('\n');
writeFileSync(`${DIR}/report.md`, report);
console.log(report);
