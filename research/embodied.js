// The same outcomes and paired comparisons as research/analyze.js, for runs of
// the game itself (scripts/batch.js --generations --json).
//
//   node research/embodied.js none=none.json verdict=verdict.json rule=rule.json [--switch-at 4]
//
// Every file must come from the same --seed, so lineage i of one file lives in
// the same worlds as lineage i of the others, and they are compared in pairs.

import { readFileSync } from 'node:fs';
import { mean, bootstrapCI, paired, holm } from './stats.js';

const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);

export function embodiedOutcomes(gens, S) {
  const at = (g) => gens.find((r) => r.g === g);
  const perAnt = (g, f) => (at(g) ? f(at(g)) / at(g).ants : NaN);
  const stable = range(1, S).filter(at);
  return {
    'stable.harm': mean(stable.map((g) => perAnt(g, (r) => r.harmfulBites))),
    'stable.acc': mean(stable.map((g) => at(g).born.acc)),
    'stable.alive': mean(stable.map((g) => perAnt(g, (r) => r.alive))),
    'shock.alive': perAnt(S, (r) => r.alive),
    'shock.harm': perAnt(S, (r) => r.harmfulBites),
    'shock.myths': perAnt(S, (r) => r.falseUnlived),
    'post.harm': mean(range(S + 1, gens.length).filter(at).map((g) => perAnt(g, (r) => r.harmfulBites))),
  };
}

const fmt = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '–');

function main() {
  const argv = process.argv.slice(2);
  const S = argv.includes('--switch-at') ? Number(argv[argv.indexOf('--switch-at') + 1]) : 4;
  const files = argv.filter((a, i) => a.includes('=') && argv[i - 1] !== '--switch-at');
  const data = files.map((a) => {
    const [name, file] = a.split('=');
    const { lineages } = JSON.parse(readFileSync(file, 'utf8'));
    return { name, outcomes: lineages.map((l) => embodiedOutcomes(l, S)) };
  });
  const names = Object.keys(data[0].outcomes[0]);
  const L = [`| format | n | ${names.join(' | ')} |`, `|---|---|${names.map(() => '---').join('|')}|`];
  for (const d of data) {
    L.push(`| ${d.name} | ${d.outcomes.length} | ${names.map((k) => {
      const xs = d.outcomes.map((o) => o[k]).filter(Number.isFinite);
      const [lo, hi] = bootstrapCI(xs);
      return `${fmt(mean(xs))} [${fmt(lo)}, ${fmt(hi)}]`;
    }).join(' | ')} |`);
  }
  L.push('', '| a − b | outcome | n | diff [95% CI] | p (Holm per outcome) | dz |', '|---|---|---|---|---|---|');
  for (const k of names) {
    const cmp = [];
    for (let i = 0; i < data.length; i++) {
      for (let j = i + 1; j < data.length; j++) {
        const n = Math.min(data[i].outcomes.length, data[j].outcomes.length);
        const a = data[i].outcomes.slice(0, n).map((o) => o[k]);
        const b = data[j].outcomes.slice(0, n).map((o) => o[k]);
        const ok = a.map((x, m) => Number.isFinite(x) && Number.isFinite(b[m]));
        cmp.push({ a: data[i].name, b: data[j].name, ...paired(a.filter((_, m) => ok[m]), b.filter((_, m) => ok[m])) });
      }
    }
    holm(cmp.map((c) => c.p)).forEach((p, m) => { cmp[m].pHolm = p; });
    for (const c of cmp) L.push(`| ${c.a} − ${c.b} | ${k} | ${c.n} | ${fmt(c.diff, 3)} [${fmt(c.ci[0], 3)}, ${fmt(c.ci[1], 3)}] | ${fmt(c.pHolm, 4)} | ${fmt(c.dz)} |`);
  }
  console.log(L.join('\n'));
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) main();
