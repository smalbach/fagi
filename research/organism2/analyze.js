// The analysis of the organism follow-up evaluation, exactly as the protocol says
// (docs/research/organism2-protocol.md). Reads the pieces run.js wrote, and
// writes report.md next to them.
//
//   node research/organism2/analyze.js [research/results/organism2]

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mean, bootstrapCI, paired, holm } from '../stats.js';
import { INDIVIDUAL, ENVIRONMENTS, HYPOTHESES } from './design.js';

const DIR = process.argv[2] ?? 'research/results/organism2';

function load(kind) {
  const out = {};
  let files = [];
  try { files = readdirSync(`${DIR}/parts/${kind}`).filter((f) => f.endsWith('.json')); } catch { return out; }
  for (const f of files) {
    const [condition, env] = f.split('-');
    for (const row of JSON.parse(readFileSync(`${DIR}/parts/${kind}/${f}`, 'utf8'))) {
      ((out[condition] ??= {})[env] ??= []).push(row);
    }
  }
  for (const c of Object.values(out)) for (const rows of Object.values(c)) rows.sort((a, b) => a.i - b.i);
  return out;
}

const f3 = (v) => (v == null || Number.isNaN(v) ? '–' : (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(3)));
const ci = ([lo, hi]) => `[${f3(lo)}, ${f3(hi)}]`;
const pv = (p) => (p < 0.001 ? '< .001' : p.toFixed(3).replace(/^0/, ''));

// Paired over the seeds both conditions have.
function pair(A, B, outcome) {
  const byI = new Map(B.map((r) => [r.i, r]));
  const a = []; const b = [];
  for (const r of A) if (byI.has(r.i) && r[outcome] != null && byI.get(r.i)[outcome] != null) { a.push(r[outcome]); b.push(byI.get(r.i)[outcome]); }
  return [a, b];
}

const lines = [];
const say = (s = '') => lines.push(s);
const ind = load('individual');

say('# Organism follow-up evaluation: results');
say();
say(`Produced by \`node research/organism2/analyze.js ${DIR}\` from the pieces in \`${DIR}/parts\`. Protocol: \`docs/research/organism2-protocol.md\`.`);
say();

// --- confirmatory ------------------------------------------------------------
say('## Confirmatory hypotheses');
say();
say('One-sided paired sign-flip permutation tests of a − b > 0 (10 000 permutations), 95% bootstrap interval of the mean difference, dz; Holm over all four, α = .05.');
say();
const tests = HYPOTHESES.map((h) => {
  const A = ind[h.a]?.[h.env] ?? [];
  const B = ind[h.b]?.[h.env] ?? [];
  const [a, b] = pair(A, B, h.outcome);
  return { h, n: a.length, ma: mean(a), mb: mean(b), ...paired(a, b, { B: 10000, alternative: 'greater' }) };
});
const adj = holm(tests.map((t) => t.p));
say('| test | prediction | outcome | n | a | b | a − b [95% CI] | dz | p | Holm p | supported |');
say('|---|---|---|---|---|---|---|---|---|---|---|');
tests.forEach((t, k) => {
  say(`| ${t.h.id} | ${t.h.says} (${t.h.a} vs ${t.h.b}, ${t.h.env}) | ${t.h.outcome} | ${t.n} | ${f3(t.ma)} | ${f3(t.mb)} | ${f3(t.diff)} ${ci(t.ci)} | ${f3(t.dz)} | ${pv(t.p)} | ${pv(adj[k])} | ${adj[k] < 0.05 ? 'yes' : '**no**'} |`);
});
say();

// --- exploratory: every condition against full --------------------------------
const OUTCOMES = ['lifetime', 'alive', 'safe', 'stressed', 'dose', 'firstHarm', 'repeated', 'judgment', 'helpful', 'postDose', 'postRate'];
for (const env of ENVIRONMENTS) {
  say(`## Exploratory: every condition, ${env} world`);
  say();
  say('Means per life, and in brackets the paired difference with `full` (condition − full) and its 95% bootstrap interval. Not corrected for multiplicity: descriptive.');
  say();
  const outs = OUTCOMES.filter((o) => env === 'shift' || !o.startsWith('post'));
  say(`| condition | n | ${outs.join(' | ')} | deaths |`);
  say(`|---|---|${outs.map(() => '---').join('|')}|---|`);
  for (const c of Object.keys(INDIVIDUAL)) {
    const rows = ind[c]?.[env] ?? [];
    if (!rows.length) continue;
    const cells = outs.map((o) => {
      const m = mean(rows.map((r) => r[o]).filter((v) => v != null));
      if (c === 'full') return f3(m);
      const [a, b] = pair(rows, ind.full?.[env] ?? [], o);
      const d = a.map((x, i) => x - b[i]);
      return `${f3(m)} (${f3(mean(d))} ${ci(bootstrapCI(d, { seed: 3 }))})`;
    });
    const causes = {};
    for (const r of rows) if (r.cause) causes[r.cause] = (causes[r.cause] ?? 0) + 1;
    say(`| ${c} | ${rows.length} | ${cells.join(' | ')} | ${Object.entries(causes).map(([k, n]) => `${k} ${n}`).join(', ') || '–'} |`);
  }
  say();
}

const report = lines.join('\n');
writeFileSync(`${DIR}/report.md`, report);
console.log(report);
