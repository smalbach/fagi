// The research site's per-generation curves (investigacion/data/generations.json).
//
// The main study's headline cell — one-trait chemistry, lives of 1800 s,
// three fruit met at once, inversion at generation 6 — rerun with its own
// seeds (1001–1200), generation by generation, for every format. Same code
// and seeds as research/run.js, so generation 6 here is the study's
// shock.alive and shock.myths; this only keeps the generations it averages.
//
//   node scripts/site-data.js [--seeds 200]

import { writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { runLineage } from '../research/lab/lineage.js';
import { params } from '../research/lab/params.js';

const arg = (name, d) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : d;
};
const SEEDS = arg('seeds', 200);
const SEED0 = 1001;
const FORMATS = ['none', 'verdict', 'rule', 'evidence'];
const BASE = { family: 'one', life: 1800, choices: 3, switchAt: 6, generations: 12, change: 'invert' };
const r3 = (v) => Math.round(v * 1000) / 1000;

const out = {
  design: { ...BASE, seeds: [SEED0, SEED0 + SEEDS - 1] },
  commit: (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return ''; } })(),
  formats: {},
};

for (const format of FORMATS) {
  const p = params({ ...BASE, format });
  const sums = Array.from({ length: BASE.generations }, () => ({ alive: 0, harmful: 0, myths: 0, acc: 0 }));
  for (let s = 0; s < SEEDS; s++) {
    const { rows } = runLineage(p, SEED0 + s);
    for (const row of rows) {
      const a = sums[row.g];
      a.alive += row.alive / row.ants;
      a.harmful += row.harmful / row.ants;
      a.myths += row.mythsEnd / row.ants;
      a.acc += row.accBirth;
    }
  }
  out.formats[format] = Object.fromEntries(['alive', 'harmful', 'myths', 'acc'].map((k) => [k, sums.map((a) => r3(a[k] / SEEDS))]));
  process.stderr.write(`${format}: generation 6 alive ${out.formats[format].alive[6]}, myths ${out.formats[format].myths[6]}\n`);
}

mkdirSync(new URL('../investigacion/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../investigacion/data/generations.json', import.meta.url), `${JSON.stringify(out)}\n`);
