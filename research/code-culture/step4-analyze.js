// Step 4 pilot (step4-piloto-protocolo.md): per format and generation, the
// share of Fagis whose text keeps the myth (leaves the old poison, which
// after the inversion nourishes), the share that learned the new poison
// (leaves the old food), harmful bites and survival.
//
//   node research/code-culture/step4-analyze.js [--runs f-code,f-reasons,f-evidence]

import { existsSync, readFileSync } from 'node:fs';
import { ruleOf, leaves } from './rule.js';

const argv = process.argv.slice(2);
const RUNS = (argv.includes('--runs') ? argv[argv.indexOf('--runs') + 1] : 'f-code,f-reasons,f-evidence').split(',');
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const f = (x) => (Number.isNaN(x) ? '—' : x.toFixed(2));

for (const run of RUNS) {
  const dir = `research/results/code-culture/lineages/${run}`;
  if (!existsSync(`${dir}/run.json`)) continue;
  const info = JSON.parse(readFileSync(`${dir}/run.json`, 'utf8'));
  const texts = JSON.parse(readFileSync(`${dir}/texts.json`, 'utf8'));
  const cache = new Map();
  const leave = (id, r, value) => { const k = `${id}|${r}|${value}`; if (!cache.has(k)) cache.set(k, leaves(texts[id], ruleOf(r).dim, value)); return cache.get(k); };
  console.log(`\n## ${run} (format ${info.format}, inversion at g${info.invertAt})`);
  console.log('| g | myth: leaves old poison | new: leaves old food | harmful bites | survival − current |');
  console.log('|---|---|---|---|---|');
  for (let g = 0; g < (info.until ?? info.G); g++) {
    const rows = [];
    for (let r = 0; r < info.R; r++) {
      const file = `${dir}/r${r}-g${g}.json`;
      if (!existsSync(file)) continue;
      const { lives } = JSON.parse(readFileSync(file, 'utf8'));
      const rule = ruleOf(r);
      rows.push({
        myth: mean(lives.map((l) => leave(l.text, r, rule.poison))),
        fresh: mean(lives.map((l) => leave(l.text, r, rule.food))),
        harmed: mean(lives.map((l) => l.harmed)),
        surv: mean(lives.map((l) => l.survival - l.current)),
      });
    }
    if (!rows.length) continue;
    console.log(`| ${g}${g === info.invertAt ? ' (inverted)' : ''} | ${f(mean(rows.map((x) => x.myth)))} | ${f(mean(rows.map((x) => x.fresh)))} | ${f(mean(rows.map((x) => x.harmed)))} | ${f(mean(rows.map((x) => x.surv)))} |`);
  }
}
