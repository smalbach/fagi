#!/usr/bin/env node
// The research site's population explorer (investigacion/data/inheritance.json),
// from the raw lives of the second inheritance study:
//
//   node scripts/site-inheritance-data.js research/prereg-inheritance-2
//
// Per damage, arm and population: 6 generations × 16 lives, each life packed
// as one number: (mother + 1) * 4 + alive * 2 + carriesRepair, where mother is
// her mother's slot in the previous generation (-1 if she had none) and
// carriesRepair says whether she carried a line that repairs the damage.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('usage: site-inheritance-data.js <dir>');
const PLAN = JSON.parse(readFileSync(new URL('../docs/research/prereg-inheritance-2.json', import.meta.url), 'utf8'));
const ARMS = ['born', 'learn', 'inheritAny', 'inherit'];

const out = { study: 'docs/research/prereg-inheritance-2-results.md', damages: {} };
for (const damage of PLAN.damages) {
  const prefix = PLAN.repairPrefix[damage];
  const d = join(dir, damage);
  if (!existsSync(d)) continue;
  const files = readdirSync(d);
  const entry = { repair: prefix || null, arms: {} };
  for (const arm of ARMS) {
    const pops = files.filter((f) => f.startsWith(`${arm}-`) && f.endsWith('.json'))
      .map((f) => Number(f.slice(arm.length + 1, -5))).sort((a, b) => a - b);
    if (!pops.length) continue;
    entry.arms[arm] = pops.map((p) => {
      const rows = JSON.parse(readFileSync(join(d, `${arm}-${p}.json`), 'utf8'));
      const gens = [];
      for (const r of rows) {
        const lines = [...r.inherited, ...r.own];
        // Intact program: any line she carries is a rewrite of a program with nothing to repair.
        const repair = prefix ? lines.some((id) => id.startsWith(prefix)) : lines.length > 0;
        (gens[r.g] ??= [])[r.i] = ((r.mother ?? -1) + 1) * 4 + r.alive * 2 + (repair ? 1 : 0);
      }
      return gens;
    });
  }
  out.damages[damage] = entry;
}
writeFileSync(new URL('../investigacion/data/inheritance.json', import.meta.url), JSON.stringify(out));
console.log(Object.entries(out.damages).map(([k, v]) => `${k}: ${Object.entries(v.arms).map(([a, p]) => `${a} ${p.length}`).join(', ')}`).join('\n'));
