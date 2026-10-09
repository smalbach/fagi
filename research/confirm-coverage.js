// The confirmatory analysis of the information-matched replication, exactly
// as preregistered (docs/research/preregistration-coverage.md). Nothing here
// may change after the preregistration is frozen.
//
//   node research/confirm-coverage.js research/results/coverage-items research/results/coverage-coverage
//
// Six one-sided tests, each a sign-flip permutation test on per-lineage paired
// differences (10 000 permutations), Holm-corrected together at α = .05.
// All cells: one-trait chemistry, inversion at generation 6, lives of 1800 s.

import { writeFileSync } from 'node:fs';
import { collect } from './analyze.js';
import { paired, holm, bootstrapCI } from './stats.js';

const B = 10000;
const [ITEMS, COVER] = process.argv.slice(2);
const vals = (data, format, outcome) => {
  const c = data.cells.find((x) => x.cell.format === format);
  return Object.fromEntries(c.seeds.map((s, i) => [s, c.values[outcome][i]]));
};
const diff = (data, a, b, outcome) => { const va = vals(data, a, outcome), vb = vals(data, b, outcome); return Object.fromEntries(Object.keys(va).filter((s) => s in vb).map((s) => [s, va[s] - vb[s]])); };

export function confirm(items, cover) {
  const zero = (o) => Object.fromEntries(Object.keys(o).map((s) => [s, 0]));
  const tests = [
    { id: 'C0', text: 'with items, reason-lineages have fewer survivors at an inversion than verdict-lineages (H2a replicated on fresh seeds)', d: diff(items, 'verdict', 'rule', 'shock.alive') },
    { id: 'C1', text: 'the H2a gap is larger with items than with coverage (the survival trap depends on how much is passed)', d: (() => { const a = diff(items, 'verdict', 'rule', 'shock.alive'), b = diff(cover, 'verdict', 'rule', 'shock.alive'); return Object.fromEntries(Object.keys(a).filter((s) => s in b).map((s) => [s, a[s] - b[s]])); })() },
    { id: 'C2', text: 'with coverage, reason-lineages carry more myths into an inversion than verdict-lineages', d: diff(cover, 'rule', 'verdict', 'shock.myths') },
    { id: 'C3', text: 'with coverage, evidence carries fewer myths into an inversion than reasons alone', d: diff(cover, 'rule', 'evidence', 'shock.myths') },
    { id: 'C4', text: 'with coverage, evidence teaches better than verdicts in a steady world', d: diff(cover, 'verdict', 'evidence', 'stable.harm') },
    { id: 'C5', text: 'with coverage, reasons teach better than verdicts in a steady world', d: diff(cover, 'verdict', 'rule', 'stable.harm') },
  ];
  const out = tests.map((t) => { const d = Object.values(t.d); return { ...t, ...paired(d, d.map(() => 0), { B, alternative: 'greater' }) }; });
  holm(out.map((r) => r.p)).forEach((p, i) => { out[i].pHolm = p; });
  const trap = Object.values(diff(cover, 'verdict', 'rule', 'shock.alive'));
  const ci = bootstrapCI(trap, { B: 4000, seed: 4242 });
  return { tests: out, trap: { mean: trap.reduce((a, b) => a + b, 0) / trap.length, ci } };
}

if (process.argv[1]?.endsWith('confirm-coverage.js')) {
  const r = confirm(collect(ITEMS), collect(COVER));
  const f = (x, d = 3) => (Number.isFinite(x) ? x.toFixed(d) : '–');
  const lines = ['| test | claim | n | diff [95% CI] | dz | p | p (Holm) | supported |', '|---|---|---|---|---|---|---|---|'];
  for (const t of r.tests) lines.push(`| ${t.id} | ${t.text} | ${t.n} | ${f(t.diff)} [${f(t.ci[0])}, ${f(t.ci[1])}] | ${f(t.dz, 2)} | ${f(t.p, 4)} | ${f(t.pHolm, 4)} | ${t.pHolm < 0.05 ? 'yes' : 'no'} |`);
  lines.push('', `Descriptive (preregistered): with coverage, verdict − rule survivors at the inversion = ${f(r.trap.mean)} [${f(r.trap.ci[0])}, ${f(r.trap.ci[1])}].`);
  const text = lines.join('\n');
  console.log(text);
  writeFileSync(`${COVER}/confirmatory.md`, `${text}\n`);
}
