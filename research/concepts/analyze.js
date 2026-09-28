// The analysis of the concepts evaluation, exactly as the protocol says
// (docs/research/concepts-protocol.md). Writes report.md next to the pieces.
//
//   node research/concepts/analyze.js [research/results/concepts]

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mean, bootstrapCI, paired, holm } from '../stats.js';
import { CONDITIONS, FAMILIES, WORLDS, HYPOTHESES, CHANCE } from './design.js';

const DIR = process.argv[2] ?? 'research/results/concepts';

const data = {};
for (const f of readdirSync(`${DIR}/parts`).filter((n) => n.endsWith('.json'))) {
  const [c, fam, w] = f.split('-');
  for (const row of JSON.parse(readFileSync(`${DIR}/parts/${f}`, 'utf8'))) (((data[c] ??= {})[fam] ??= {})[w] ??= []).push(row);
}
for (const c of Object.values(data)) for (const fam of Object.values(c)) for (const rows of Object.values(fam)) rows.sort((a, b) => a.i - b.i);
const rowsOf = (c, fam, w) => data[c]?.[fam]?.[w] ?? [];

const f3 = (v) => (v == null || Number.isNaN(v) ? '–' : (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(3)));
const ci = ([lo, hi]) => `[${f3(lo)}, ${f3(hi)}]`;
const pv = (p) => (p < 0.001 ? '< .001' : p.toFixed(3).replace(/^0/, ''));

// Paired over the lives where both have the outcome (b = 'chance': a constant).
function pair(A, B, outcome) {
  const a = []; const b = [];
  if (B === 'chance') {
    for (const r of A) if (r[outcome] != null) { a.push(r[outcome]); b.push(CHANCE); }
    return [a, b];
  }
  const byI = new Map(B.map((r) => [r.i, r]));
  for (const r of A) {
    const o = byI.get(r.i);
    if (o && r[outcome] != null && o[outcome] != null) { a.push(r[outcome]); b.push(o[outcome]); }
  }
  return [a, b];
}

const lines = [];
const say = (s = '') => lines.push(s);
say('# Concepts evaluation: results');
say();
say(`Produced by \`node research/concepts/analyze.js ${DIR}\`. Protocol: \`docs/research/concepts-protocol.md\`.`);
say();
say('## Confirmatory hypotheses');
say();
say(`One-sided paired sign-flip permutation tests of a − b > 0 (10 000 permutations; against chance, ${CHANCE}), 95% bootstrap interval of the mean difference, dz; Holm over all four, α = .05.`);
say();
const tests = HYPOTHESES.map((h) => {
  const A = rowsOf(h.a, h.family, h.world);
  const B = h.b === 'chance' ? 'chance' : rowsOf(h.b, h.family, h.world);
  const [a, b] = pair(A, B, h.outcome);
  return { h, n: a.length, ma: mean(a), mb: mean(b), ...paired(a, b, { B: 10000, alternative: 'greater' }) };
});
const adj = holm(tests.map((t) => t.p));
say('| test | prediction | family, world | outcome | n | a | b | a − b [95% CI] | dz | p | Holm p | supported |');
say('|---|---|---|---|---|---|---|---|---|---|---|---|');
tests.forEach((t, k) => {
  say(`| ${t.h.id} | ${t.h.says} (${t.h.a} vs ${t.h.b}) | ${t.h.family}, ${t.h.world} | ${t.h.outcome} | ${t.n} | ${f3(t.ma)} | ${f3(t.mb)} | ${f3(t.diff)} ${ci(t.ci)} | ${f3(t.dz)} | ${pv(t.p)} | ${pv(adj[k])} | ${adj[k] < 0.05 ? 'yes' : '**no**'} |`);
});
say();

const OUTCOMES = ['classify', 'precision', 'coverage', 'lateSeen', 'lateRight', 'lateBelieved', 'lateStings', 'lateSapUsed', 'hits', 'misses', 'concepts', 'retired', 'revised', 'surprises', 'kindsKnown', 'stings', 'sips', 'novelSips', 'lifetime', 'alive'];
for (const fam of Object.keys(FAMILIES)) {
  for (const w of WORLDS) {
    say(`## Exploratory: ${fam} family, ${w} world`);
    say();
    say('Means per life, and in brackets the paired difference with `full` (condition − full) and its 95% bootstrap interval. Not corrected: descriptive.');
    say();
    say(`| condition | n | ${OUTCOMES.join(' | ')} | deaths |`);
    say(`|---|---|${OUTCOMES.map(() => '---').join('|')}|---|`);
    for (const c of Object.keys(CONDITIONS)) {
      const rows = rowsOf(c, fam, w);
      if (!rows.length) continue;
      const cells = OUTCOMES.map((o) => {
        const m = mean(rows.map((r) => r[o]).filter((v) => v != null));
        if (c === 'full') return f3(m);
        const [a, b] = pair(rows, rowsOf('full', fam, w), o);
        const d = a.map((x, i) => x - b[i]);
        return `${f3(m)} (${f3(mean(d))} ${ci(bootstrapCI(d, { seed: 3 }))})`;
      });
      const causes = {};
      for (const r of rows) if (r.cause) causes[r.cause] = (causes[r.cause] ?? 0) + 1;
      say(`| ${c} | ${rows.length} | ${cells.join(' | ')} | ${Object.entries(causes).map(([k, n]) => `${k} ${n}`).join(', ') || '–'} |`);
    }
    say();
  }
}

const report = lines.join('\n');
writeFileSync(`${DIR}/report.md`, report);
console.log(report);
