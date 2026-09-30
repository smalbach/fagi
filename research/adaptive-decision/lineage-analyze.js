// Rules of conduct, revision 1: what the lineages did.
//
//   node research/adaptive-decision/lineage-analyze.js [--last 5] [--dir research/results/adaptive-decision/lineages] [modes...]
//
// Per mode: survival by generation; over the last generations, paired with
// `current` on the very same worlds (world n); and which lines the last
// generation lives by.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { mean, bootstrapCI, paired } from '../stats.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);
const DIR = opt('--dir', 'research/results/adaptive-decision/lineages');
const LAST = Number(opt('--last', 5));
const modes = argv.filter((a, i) => !a.startsWith('--') && !['--dir', '--last'].includes(argv[i - 1]));

export function loadMode(mode, dir = DIR) {
  const d = `${dir}/${mode}`;
  if (!existsSync(d)) return [];
  return readdirSync(d).filter((f) => /^r\d+-g\d+-k\d+\.json$/.test(f)).map((f) => JSON.parse(readFileSync(`${d}/${f}`, 'utf8')));
}

// What kind of line it is, by what it says.
export function kindOfLine(l) {
  const i = l.if;
  const hunger = i.hungerBelow != null || i.hungerFrom != null;
  if (l.do === 'taste' && i.novel) return 'taste the new';
  if (l.do === 'leave' && (i.harmed || i.harmedMostly)) return 'leave what harmed';
  if (l.do === 'leave' && i.novel) return 'leave the new';
  if (i.traits) return `${l.do} a look`;
  if (hunger && Object.keys(i).length === (i.hungerBelow != null) + (i.hungerFrom != null)) return `${l.do} by hunger alone`;
  return `${l.do} other`;
}

const f3 = (v) => (v == null || Number.isNaN(v) ? '—' : v.toFixed(3));

if (import.meta.url === `file://${process.argv[1]}`) {
  const all = Object.fromEntries((modes.length ? modes : readdirSync(DIR)).map((m) => [m, loadMode(m)]));
  const G = Math.max(...Object.values(all).flat().map((x) => x.g)) + 1;
  console.log(`survival by generation (mean over lineages and sisters):`);
  for (const [m, rows] of Object.entries(all)) {
    const by = Array.from({ length: G }, (_, g) => mean(rows.filter((x) => x.g === g).map((x) => x.survival)));
    console.log(`  ${m.padEnd(10)} ${by.map((v) => f3(v).slice(1)).join(' ')}`);
  }
  const cur = Object.fromEntries((all.current ?? []).map((x) => [x.n, x.survival]));
  console.log(`\nlast ${LAST} generations, paired with current on the same worlds:`);
  for (const [m, rows] of Object.entries(all)) {
    if (m === 'current') continue;
    const last = rows.filter((x) => x.g >= G - LAST && cur[x.n] != null);
    // The unit is the lineage: its mean over the last generations, minus current's on the same worlds.
    const byR = {};
    for (const x of last) (byR[x.r] ??= []).push(x);
    const a = Object.values(byR).map((xs) => mean(xs.map((x) => x.survival)));
    const b = Object.values(byR).map((xs) => mean(xs.map((x) => cur[x.n])));
    const d = paired(a, b);
    console.log(`  ${m.padEnd(10)} ${f3(mean(a))} vs ${f3(mean(b))}: ${f3(d.diff)} [${f3(d.ci[0])}, ${f3(d.ci[1])}] over ${a.length} lineages`);
  }
  console.log(`\nlines the last generation lives by (share of Fagis holding each kind):`);
  for (const [m, rows] of Object.entries(all)) {
    const last = rows.filter((x) => x.g === G - 1 && x.conduct);
    if (!last.length) continue;
    const share = {};
    for (const x of last) {
      const kinds = new Set(x.conduct.lines.filter((l) => l.retired == null).map(kindOfLine));
      for (const k of kinds) share[k] = (share[k] ?? 0) + 1 / last.length;
    }
    console.log(`  ${m}: ${Object.entries(share).sort((p, q) => q[1] - p[1]).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(', ')}`);
  }
}
