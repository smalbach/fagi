// Revision 1, step 2's gate: does a reference judge beat the current one by
// GATE on the changing families? Paired by world, families weighted alike,
// a 95% interval by resampling worlds.
//
//   node research/adaptive-decision/gate.js [--out research/results/adaptive-decision/food]

import { mean, bootstrapCI, paired } from '../stats.js';
import { load } from './summarize.js';
import { FOOD_FAMILIES } from './foodworlds.js';

const argv = process.argv.slice(2);
const OUT = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : 'research/results/adaptive-decision/food';
export const GATE = 0.10;
const CHANGING = FOOD_FAMILIES.filter((f) => f !== 'stable');
const f3 = (v) => v.toFixed(3);

const byWorld = (rows, fams) => {
  const out = {};
  for (const r of rows) if (fams.includes(r.family)) (out[r.i] ??= {})[r.family] = r.survival;
  return out;
};

export function gate(tag, ref = 'current', out = OUT) {
  if (tag.startsWith('val-') && ref === 'current') ref = 'val-current';
  if (tag.startsWith('conf-') && ref === 'current') ref = 'conf-current';
  const a = byWorld(load(tag, out), FOOD_FAMILIES);
  const b = byWorld(load(ref, out), FOOD_FAMILIES);
  const worlds = Object.keys(a).filter((i) => b[i] && FOOD_FAMILIES.every((f) => a[i][f] != null && b[i][f] != null));
  const lines = [];
  for (const f of FOOD_FAMILIES) {
    const d = paired(worlds.map((i) => a[i][f]), worlds.map((i) => b[i][f]));
    lines.push(`  ${f.padEnd(8)} ${f3(d.diff)} [${f3(d.ci[0])}, ${f3(d.ci[1])}]`);
  }
  const d = worlds.map((i) => mean(CHANGING.map((f) => a[i][f] - b[i][f])));
  const ci = bootstrapCI(d);
  const m = mean(d);
  return { tag, ref, n: worlds.length, diff: m, ci, pass: m >= GATE && ci[0] > 0, lines };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const tag of argv.filter((x, i) => !x.startsWith('--') && argv[i - 1] !== '--out').length ? argv.filter((x, i) => !x.startsWith('--') && argv[i - 1] !== '--out') : ['privileged', 'informed', 'informed2', 'informed1']) {
    const g = gate(tag);
    console.log(`${tag} − current, ${g.n} worlds:`);
    console.log(g.lines.join('\n'));
    console.log(`  changing (${CHANGING.join(' + ')}): ${f3(g.diff)} [${f3(g.ci[0])}, ${f3(g.ci[1])}] → ${g.pass ? 'PASSES' : 'does not pass'} the gate (≥ ${GATE}, interval above 0)`);
  }
}
