// The analysis of the social evaluation, exactly as the protocol says
// (docs/research/social-protocol.md). Reads the pieces run.js wrote, and
// writes report.md next to them.
//
//   node research/social/analyze.js [research/results/social]

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mean, bootstrapCI, paired, holm } from '../stats.js';
import { INFORMANTS, HYPOTHESES } from './design.js';

const DIR = process.argv[2] ?? 'research/results/social';

const data = {};
for (const f of readdirSync(`${DIR}/parts`).filter((x) => x.endsWith('.json'))) {
  const c = f.split('-')[0];
  (data[c] ??= []).push(...JSON.parse(readFileSync(`${DIR}/parts/${f}`, 'utf8')));
}
for (const rows of Object.values(data)) rows.sort((a, b) => a.i - b.i);

const f3 = (v) => (v == null || Number.isNaN(v) ? '–' : (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(3)));
const ci = ([lo, hi]) => `[${f3(lo)}, ${f3(hi)}]`;
const pv = (p) => (p < 0.001 ? '< .001' : p.toFixed(3).replace(/^0/, ''));

// Paired over the colonies both sides have. A side that is a number is a
// constant (S3 against 0.5).
function pair(a, b, outcome) {
  const rows = (side) => (typeof side === 'number' ? null : data[side] ?? []);
  const A = rows(a); const B = rows(b);
  const base = A ?? B;
  const other = A ? B : null;
  const byI = other ? new Map(other.map((r) => [r.i, r])) : null;
  const xa = []; const xb = [];
  for (const r of base) {
    const v = r[outcome];
    if (v == null) continue;
    if (byI) {
      const w = byI.get(r.i)?.[outcome];
      if (w == null) continue;
      xa.push(v); xb.push(w);
    } else if (A) { xa.push(v); xb.push(b); } else { xa.push(a); xb.push(v); }
  }
  return [xa, xb];
}

const lines = [];
const say = (s = '') => lines.push(s);
say('# Social learning with a misinformed sister: results');
say();
say(`Produced by \`node research/social/analyze.js ${DIR}\`. Protocol: \`docs/research/social-protocol.md\`.`);
say();
say('## Confirmatory hypotheses');
say();
say('One-sided paired sign-flip permutation tests of (a + shift) − b > 0 (10 000 permutations), 95% bootstrap interval of the mean difference a − b, dz; Holm over the three, α = .05.');
say();
const tests = HYPOTHESES.map((h) => {
  const [a, b] = pair(h.a, h.b, h.outcome);
  return { h, n: a.length, ma: mean(a), mb: mean(b), d: a.map((x, i) => x - b[i]), ...paired(a.map((x) => x + h.shift), b, { B: 10000, alternative: 'greater' }) };
});
const adj = holm(tests.map((t) => t.p));
say('| test | prediction | outcome | n | a | b | a − b [95% CI] | shift | dz | p | Holm p | supported |');
say('|---|---|---|---|---|---|---|---|---|---|---|---|');
tests.forEach((t, k) => {
  say(`| ${t.h.id} | ${t.h.says} (${t.h.a} vs ${t.h.b}) | ${t.h.outcome} | ${t.n} | ${f3(t.ma)} | ${f3(t.mb)} | ${f3(mean(t.d))} ${ci(bootstrapCI(t.d, { seed: 3 }))} | ${t.h.shift} | ${f3(t.dz)} | ${pv(t.p)} | ${pv(adj[k])} | ${adj[k] < 0.05 ? 'yes' : '**no**'} |`);
});
say();

const OUTCOMES = ['dose', 'judgment', 'alive', 'lifetime', 'adopted', 'adoptedFalse', 'standingFalse', 'falseShare', 'myths', 'informantJudgment', 'informantAlive'];
say('## Exploratory: every informant');
say();
say('Means per colony (naive sisters), and in brackets the paired difference with `none` and its 95% bootstrap interval. Not corrected: descriptive.');
say();
say(`| informant | n | ${OUTCOMES.join(' | ')} | deaths |`);
say(`|---|---|${OUTCOMES.map(() => '---').join('|')}|---|`);
for (const c of INFORMANTS) {
  const rows = data[c] ?? [];
  if (!rows.length) continue;
  const cells = OUTCOMES.map((o) => {
    const m = mean(rows.map((r) => r[o]).filter((v) => v != null));
    if (c === 'none') return f3(m);
    const [a, b] = pair(c, 'none', o);
    const d = a.map((x, i) => x - b[i]);
    return d.length ? `${f3(m)} (${f3(mean(d))} ${ci(bootstrapCI(d, { seed: 3 }))})` : f3(m);
  });
  const causes = {};
  for (const r of rows) for (const k of r.causes ?? []) causes[k] = (causes[k] ?? 0) + 1;
  say(`| ${c} | ${rows.length} | ${cells.join(' | ')} | ${Object.entries(causes).map(([k, n]) => `${k} ${n}`).join(', ') || '–'} |`);
}
say();
say('What the informant brought (mean per colony): rules, of those about eating, and of those false on this map.');
say();
say('| informant | rules | eating | false |');
say('|---|---|---|---|');
for (const c of INFORMANTS.filter((x) => x !== 'none')) {
  const b = (data[c] ?? []).map((r) => r.brought).filter(Boolean);
  if (b.length) say(`| ${c} | ${f3(mean(b.map((x) => x.rules)))} | ${f3(mean(b.map((x) => x.eating)))} | ${f3(mean(b.map((x) => x.false)))} |`);
}
say();

const report = lines.join('\n');
writeFileSync(`${DIR}/report.md`, report);
console.log(report);
