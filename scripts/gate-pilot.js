#!/usr/bin/env node
// Fixes Z*, the evidence threshold of the inheritGated arm, as written in
// docs/research/prereg-inheritance-4.md, from a pilot on seeds the study never
// uses. Reads `inherit` runs made with --evidence, laid out as
// <dir>/<damage>/inherit-<pop>.json, and looks at the revisions mothers would
// pass on (every life of generations 0-4 that wrote or carried a revision).
//
// Z* is the smallest z (improvement / its standard error) that passes at most
// maxIntactPass of the control world's revisions and at least minRepairPass of
// the damaged world's repair revisions. If none does, the gate arm is dropped.
//
//   node scripts/gate-pilot.js <dir>

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('usage: gate-pilot.js <dir>');
const PLAN = JSON.parse(readFileSync(new URL('../docs/research/prereg-inheritance-4.json', import.meta.url), 'utf8'));
const { damage, control, maxIntactPass, minRepairPass } = PLAN.gatePilot;
const prefix = PLAN.repairPrefix[damage];

// Each revision once per mother: the upserts in her genome (inherited ones
// included, as they are what she would pass on).
function revisions(world) {
  const d = join(dir, world);
  if (!existsSync(d)) throw new Error(`missing ${d}`);
  const out = [];
  for (const f of readdirSync(d).filter((x) => x.startsWith('inherit-') && x.endsWith('.json'))) {
    for (const r of JSON.parse(readFileSync(join(d, f), 'utf8'))) {
      if (r.g > 4) continue;
      if (!r.revisions) throw new Error(`${f} was run without --evidence`);
      for (const v of r.revisions) if (v.op === 'upsert') out.push(v);
    }
  }
  return out;
}

const ctl = revisions(control);
const rep = revisions(damage).filter((v) => v.id.startsWith(prefix));
const other = revisions(damage).filter((v) => !v.id.startsWith(prefix));
const share = (xs, z) => xs.filter((v) => v.z >= z).length / xs.length;
const q = (xs, f) => { const s = xs.map((v) => v.z).sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(f * s.length))]; };

console.log(`revisions (upserts in mothers' genomes, gens 0-4): ${control} ${ctl.length}, ${damage} repair (${prefix}*) ${rep.length}, ${damage} other ${other.length}`);
for (const [name, xs] of [[control, ctl], [`${damage} repair`, rep], [`${damage} other`, other]]) {
  if (xs.length) console.log(`  z of ${name.padEnd(14)} quartiles ${[0.25, 0.5, 0.75].map((f) => q(xs, f).toFixed(2)).join(' / ')}  max ${q(xs, 1).toFixed(2)}`);
}
console.log('\n  z      passes control  passes repair  passes other');
const grid = [...new Set([...ctl, ...rep].map((v) => v.z))].filter(Number.isFinite).sort((a, b) => a - b);
const steps = [2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 10];
for (const z of steps) console.log(`  ${z.toFixed(1).padStart(4)}   ${share(ctl, z).toFixed(3).padStart(13)}  ${share(rep, z).toFixed(3).padStart(13)}  ${other.length ? share(other, z).toFixed(3).padStart(12) : '           -'}`);

const zstar = grid.find((z) => share(ctl, z) <= maxIntactPass && share(rep, z) >= minRepairPass);
console.log(zstar === undefined
  ? `\nZ* none: no z passes at most ${maxIntactPass} of ${control} revisions and at least ${minRepairPass} of repairs -> drop inheritGated`
  : `\nZ* = ${zstar.toFixed(2)}: passes ${share(ctl, zstar).toFixed(3)} of ${control} revisions, ${share(rep, zstar).toFixed(3)} of repairs`);
