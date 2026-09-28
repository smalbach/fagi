// Turns a run (research/run.js) into lineage-level outcomes and compares
// cells.
//
//   node research/analyze.js research/results/pilot [--compare format] [--json]
//
// Outcomes, one number per lineage (S = the generation the world changes,
// G = generations). Generation 0 is left out of the steady state: it is the
// founders, raised by the seeded theory rather than by the culture.
//   stable.harm    harmful bites per ant, generations 1..S-1
//   stable.acc     balanced accuracy at birth (what the culture teaches), 1..S-1
//   stable.alive   survivors per ant, 1..S-1
//   shock.alive    survivors per ant in generation S
//   shock.harm     harmful bites per ant in generation S
//   shock.lost     meals lost in generation S: food met while hungry and not eaten
//   shock.myths    false beliefs she did not live, per ant, at the end of S
//   recovery       generations after S until what newborns are taught is back
//                  within 0.05 of its steady-state accuracy (censored at G-S)
//   excess.harm    what the change cost: harmful bites per ant above the steady
//                  state, summed over S..S+2
//   post.harm      harmful bites per ant, S+1..G-1
//   myths.total    false unlived beliefs per ant, summed over S..G-1
//
// With --compare F, every pair of levels of factor F is compared within each
// combination of the other factors, seed by seed, with Holm's correction over
// all the comparisons of one outcome. Each comparison also says how many
// lineages per cell would detect its effect with 80% power.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { readCsv, paramsOf, cells, cellId } from './run.js';
import { mean, bootstrapCI, paired, holm, lineagesNeeded } from './stats.js';

export const OUTCOMES = [
  'stable.harm', 'stable.acc', 'stable.alive',
  'shock.alive', 'shock.harm', 'shock.lost', 'shock.myths',
  'recovery', 'excess.harm', 'post.harm', 'myths.total',
];

const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);

// The outcomes of one lineage from its rows (sorted by generation).
export function outcomes(rows, p) {
  const S = p.switchAt;
  const G = p.generations;
  const at = (g) => rows.find((r) => r.g === g);
  const perAnt = (g, k) => (at(g) ? at(g)[k] / at(g).ants : NaN);
  const over = (gs, f) => mean(gs.filter(at).map(f));
  const stable = range(1, S);
  const post = range(S + 1, G);
  const lost = (g) => (at(g)?.encounters ? at(g).foodSkipped / at(g).encounters : 0);
  const acc0 = over(stable, (g) => at(g).accBirth);
  let recovery = G - S;
  for (const g of range(S + 1, G)) {
    if (at(g) && at(g).accBirth >= acc0 - 0.05) { recovery = g - S; break; }
  }
  return {
    'stable.harm': over(stable, (g) => perAnt(g, 'harmful')),
    'stable.acc': acc0,
    'stable.alive': over(stable, (g) => perAnt(g, 'alive')),
    'shock.alive': perAnt(S, 'alive'),
    'shock.harm': perAnt(S, 'harmful'),
    'shock.lost': lost(S),
    'shock.myths': perAnt(S, 'mythsEnd'),
    recovery: Number.isNaN(acc0) ? NaN : recovery,
    'excess.harm': range(S, Math.min(S + 3, G)).reduce((a, g) => a + perAnt(g, 'harmful'), 0)
      - Math.min(3, G - S) * over(stable, (g) => perAnt(g, 'harmful')),
    'post.harm': over(post, (g) => perAnt(g, 'harmful')),
    'myths.total': range(S, G).reduce((a, g) => a + (at(g) ? perAnt(g, 'mythsEnd') : 0), 0),
  };
}

// What happened to false beliefs, per lineage: how many lineages of belief were
// false at some point, how long they were held while false, how often they
// were passed on, and how many came from the seeded theory.
export function mythsOf(entries) {
  const f = entries.filter((e) => e.falseGens > 0);
  return {
    falseLines: f.length,
    falseGens: f.length ? mean(f.map((e) => e.falseGens)) : 0,
    toldPerLine: f.length ? mean(f.map((e) => e.told)) : 0,
    seeded: f.filter((e) => e.seeded).length,
  };
}

// Everything per cell: { cell, id, seeds: [...], values: { outcome: [...] } }.
export function collect(dir) {
  const manifest = JSON.parse(readFileSync(`${dir}/manifest.json`, 'utf8'));
  const design = manifest.design;
  const rows = readCsv(`${dir}/rows.csv`);
  const gen = existsSync(`${dir}/genealogy.jsonl`)
    ? readFileSync(`${dir}/genealogy.jsonl`, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
    : [];
  const out = [];
  for (const cell of cells(design)) {
    const id = cellId(cell);
    const p = paramsOf(design, cell);
    const mine = rows.filter((r) => r.cell === id);
    const seeds = [...new Set(mine.map((r) => r.seed))].sort((a, b) => a - b);
    const values = Object.fromEntries([...OUTCOMES, 'myth.lines', 'myth.gens', 'myth.told'].map((o) => [o, []]));
    for (const s of seeds) {
      const o = outcomes(mine.filter((r) => r.seed === s).sort((a, b) => a.g - b.g), p);
      for (const k of OUTCOMES) values[k].push(o[k]);
      const m = mythsOf(gen.filter((e) => e.cell === id && e.seed === s));
      values['myth.lines'].push(m.falseLines);
      values['myth.gens'].push(m.falseGens);
      values['myth.told'].push(m.toldPerLine);
    }
    out.push({ cell, id, seeds, values });
  }
  return { design, cells: out };
}

const fmt = (x, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '–');

export function summary(data) {
  const names = Object.keys(data.cells[0]?.values ?? {});
  const L = [`## Cells (${data.design.name}): mean [95% CI] per lineage\n`];
  L.push(`| cell | n | ${names.join(' | ')} |`);
  L.push(`|---|---|${names.map(() => '---').join('|')}|`);
  for (const c of data.cells) {
    L.push(`| ${c.id} | ${c.seeds.length} | ${names.map((k) => {
      const xs = c.values[k].filter(Number.isFinite);
      const [lo, hi] = bootstrapCI(xs);
      return `${fmt(mean(xs))} [${fmt(lo)}, ${fmt(hi)}]`;
    }).join(' | ')} |`);
  }
  return L.join('\n');
}

export function compare(data, factor) {
  const others = Object.keys(data.design.factors ?? {}).filter((f) => f !== factor);
  const levels = data.design.factors?.[factor];
  if (!levels) throw new Error(`no factor ${factor} in the design`);
  const groups = new Map();
  for (const c of data.cells) {
    const key = others.map((f) => `${f}=${c.cell[f]}`).join(';') || 'all';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  const comparisons = [];
  for (const [key, cs] of groups) {
    for (let i = 0; i < levels.length; i++) {
      for (let j = i + 1; j < levels.length; j++) {
        const a = cs.find((c) => c.cell[factor] === levels[i]);
        const b = cs.find((c) => c.cell[factor] === levels[j]);
        if (!a || !b) continue;
        const shared = a.seeds.filter((s) => b.seeds.includes(s));
        for (const o of OUTCOMES) {
          const va = shared.map((s) => a.values[o][a.seeds.indexOf(s)]);
          const vb = shared.map((s) => b.values[o][b.seeds.indexOf(s)]);
          const ok = va.map((x, k) => Number.isFinite(x) && Number.isFinite(vb[k]));
          const r = paired(va.filter((_, k) => ok[k]), vb.filter((_, k) => ok[k]));
          comparisons.push({ within: key, a: levels[i], b: levels[j], outcome: o, ...r });
        }
      }
    }
  }
  for (const o of OUTCOMES) {
    const mine = comparisons.filter((c) => c.outcome === o);
    holm(mine.map((c) => c.p)).forEach((p, k) => { mine[k].pHolm = p; });
  }
  return comparisons;
}

export function comparisonTable(comparisons, factor) {
  const L = [`## ${factor}: paired differences (a − b), Holm-adjusted per outcome`];
  for (const o of OUTCOMES) {
    const mine = comparisons.filter((c) => c.outcome === o);
    if (!mine.length) continue;
    L.push(`\n### ${o}\n`);
    L.push('| within | a − b | n | diff [95% CI] | p (Holm) | dz | lineages for 80% power |');
    L.push('|---|---|---|---|---|---|---|');
    for (const c of mine) {
      L.push(`| ${c.within} | ${c.a} − ${c.b} | ${c.n} | ${fmt(c.diff, 3)} [${fmt(c.ci[0], 3)}, ${fmt(c.ci[1], 3)}] | ${fmt(c.pHolm, 4)} | ${fmt(c.dz)} | ${lineagesNeeded(c.dz)} |`);
    }
  }
  return L.join('\n');
}

// Does the a − b difference change with a moderator? Per seed, the difference
// at level m1 minus the difference at level m2 (every other factor fixed at
// `at`), tested like any paired comparison: an interaction, lineage by lineage.
export function interaction(data, { factor, a, b, moderator, m1, m2, outcome, at = {} }) {
  const find = (fv, mv) => data.cells.find((c) => String(c.cell[factor]) === String(fv)
    && String(c.cell[moderator]) === String(mv)
    && Object.entries(at).every(([k, v]) => String(c.cell[k]) === String(v)));
  const cs = [find(a, m1), find(b, m1), find(a, m2), find(b, m2)];
  if (cs.some((c) => !c)) throw new Error('a cell of the interaction is missing');
  const seeds = cs[0].seeds.filter((sd) => cs.every((c) => c.seeds.includes(sd)));
  const v = (c, sd) => c.values[outcome][c.seeds.indexOf(sd)];
  const d1 = seeds.map((sd) => v(cs[0], sd) - v(cs[1], sd));
  const d2 = seeds.map((sd) => v(cs[2], sd) - v(cs[3], sd));
  return { outcome, diffAt: { [m1]: mean(d1), [m2]: mean(d2) }, ...paired(d1, d2) };
}

function main() {
  const argv = process.argv.slice(2);
  const dir = argv[0];
  if (!dir) throw new Error('usage: node research/analyze.js DIR [--compare FACTOR] [--json]');
  const factor = argv.includes('--compare') ? argv[argv.indexOf('--compare') + 1] : null;
  const data = collect(dir);
  const parts = [summary(data)];
  let comparisons = null;
  if (factor) {
    comparisons = compare(data, factor);
    parts.push(comparisonTable(comparisons, factor));
  }
  // --interaction format:verdict,rule life:1800,900 shock.alive [change=invert ...]
  const ix = argv.indexOf('--interaction');
  if (ix >= 0) {
    const [factorName, levels] = argv[ix + 1].split(':');
    const [moderator, mods] = argv[ix + 2].split(':');
    const outcome = argv[ix + 3];
    const at = Object.fromEntries(argv.slice(ix + 4).filter((x) => x.includes('=') && !x.startsWith('--')).map((x) => x.split('=')));
    const [a, b] = levels.split(',');
    const [m1, m2] = mods.split(',');
    const r = interaction(data, { factor: factorName, a, b, moderator, m1, m2, outcome, at });
    parts.push(`## Interaction: (${a} − ${b}) at ${moderator}=${m1} minus at ${m2}, ${outcome}\n\n`
      + `${a} − ${b}: ${fmt(r.diffAt[m1], 3)} at ${m1}, ${fmt(r.diffAt[m2], 3)} at ${m2}; `
      + `difference ${fmt(r.diff, 3)} [${fmt(r.ci[0], 3)}, ${fmt(r.ci[1], 3)}], p ${fmt(r.p, 4)}, dz ${fmt(r.dz)}, n ${r.n}`);
  }
  const text = parts.join('\n\n');
  writeFileSync(`${dir}/summary.md`, `${text}\n`);
  if (argv.includes('--json')) writeFileSync(`${dir}/summary.json`, JSON.stringify({ cells: data.cells, comparisons }, null, 1));
  console.log(text);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  try { main(); } catch (e) { console.error(e.message); process.exit(1); }
}
