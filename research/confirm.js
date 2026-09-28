// The confirmatory analysis of the main study, exactly as preregistered
// (docs/research/preregistration.md). Nothing here may change after the
// preregistration is frozen; anything else is exploratory and goes elsewhere.
//
//   node research/confirm.js research/results/main
//
// Eleven one-sided tests, each a sign-flip permutation test on per-lineage
// paired differences (10 000 permutations), Holm-corrected together at α = .05.
// Unless a test says otherwise: one-trait chemistry, life 1800, inversion.

import { writeFileSync } from 'node:fs';
import { collect, interaction } from './analyze.js';
import { paired, holm } from './stats.js';

const AT = { family: 'one', life: 1800, change: 'invert' };
const B = 10000;

export const TESTS = [
  { id: 'H1', text: 'reasons teach better in a steady world', outcome: 'stable.harm', a: 'verdict', b: 'rule' },
  { id: 'H2a', text: 'at an inversion, reason-lineages have fewer survivors than verdict-lineages', outcome: 'shock.alive', a: 'verdict', b: 'rule' },
  { id: 'H2b', text: '… and fewer than lineages that pass nothing on', outcome: 'shock.alive', a: 'none', b: 'rule' },
  { id: 'H3', text: 'reason-lineages carry more myths into an inversion than verdict-lineages', outcome: 'shock.myths', a: 'rule', b: 'verdict' },
  { id: 'H4a', text: 'evidence carries fewer myths into an inversion than reasons alone', outcome: 'shock.myths', a: 'rule', b: 'evidence' },
  { id: 'H4b', text: 'evidence-lineages have more survivors at an inversion than reason-lineages', outcome: 'shock.alive', a: 'evidence', b: 'rule' },
  { id: 'H4c', text: 'evidence teaches better than verdicts in a steady world', outcome: 'stable.harm', a: 'verdict', b: 'evidence' },
  { id: 'H5a', text: 'the H2a gap is larger when the world inverts than when the poison rotates', outcome: 'shock.alive', a: 'verdict', b: 'rule', moderator: 'change', m1: 'invert', m2: 'rotate' },
  { id: 'H5b', text: '… than when the poison shifts to another dimension', outcome: 'shock.alive', a: 'verdict', b: 'rule', moderator: 'change', m1: 'invert', m2: 'shift' },
  { id: 'H6a', text: 'the H2a gap is larger with lives of 1800 s than of 900 s', outcome: 'shock.alive', a: 'verdict', b: 'rule', moderator: 'life', m1: 1800, m2: 900 },
  { id: 'H6b', text: 'the H3 difference holds with lives of 900 s', outcome: 'shock.myths', a: 'rule', b: 'verdict', at: { life: 900 } },
];

function cellOf(data, cell) {
  return data.cells.find((c) => Object.entries(cell).every(([k, v]) => String(c.cell[k]) === String(v)));
}

export function confirm(data) {
  const results = TESTS.map((t) => {
    const at = { ...AT, ...(t.at ?? {}) };
    if (t.moderator) {
      const { [t.moderator]: _, ...rest } = at;
      const r = interaction(data, {
        factor: 'format', a: t.a, b: t.b, moderator: t.moderator, m1: t.m1, m2: t.m2,
        outcome: t.outcome, at: rest, alternative: 'greater',
      });
      return { ...t, ...r };
    }
    const ca = cellOf(data, { ...at, format: t.a });
    const cb = cellOf(data, { ...at, format: t.b });
    if (!ca || !cb) throw new Error(`${t.id}: a cell is missing`);
    const seeds = ca.seeds.filter((s) => cb.seeds.includes(s));
    const va = seeds.map((s) => ca.values[t.outcome][ca.seeds.indexOf(s)]);
    const vb = seeds.map((s) => cb.values[t.outcome][cb.seeds.indexOf(s)]);
    return { ...t, ...paired(va, vb, { B, alternative: 'greater' }) };
  });
  holm(results.map((r) => r.p)).forEach((p, i) => { results[i].pHolm = p; });
  return results;
}

const fmt = (x, d = 3) => (Number.isFinite(x) ? x.toFixed(d) : '–');

function main() {
  const dir = process.argv[2];
  if (!dir) throw new Error('usage: node research/confirm.js DIR');
  const results = confirm(collect(dir));
  const L = ['## Confirmatory tests (one-sided, Holm over all eleven)\n',
    '| test | hypothesis | outcome | a − b | n | diff [95% CI] | dz | p | p (Holm) | supported |',
    '|---|---|---|---|---|---|---|---|---|---|'];
  for (const r of results) {
    L.push(`| ${r.id} | ${r.text} | ${r.outcome} | ${r.a} − ${r.b}${r.moderator ? ` (${r.moderator} ${r.m1} vs ${r.m2})` : ''} | ${r.n} | ${fmt(r.diff)} [${fmt(r.ci[0])}, ${fmt(r.ci[1])}] | ${fmt(r.dz, 2)} | ${fmt(r.p, 4)} | ${fmt(r.pHolm, 4)} | ${r.pHolm < 0.05 ? 'yes' : 'no'} |`);
  }
  const text = L.join('\n');
  writeFileSync(`${dir}/confirmatory.md`, `${text}\n`);
  console.log(text);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  try { main(); } catch (e) { console.error(e.message); process.exit(1); }
}
