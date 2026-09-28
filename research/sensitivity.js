// Does an effect survive the parameters I tuned by hand?
//
//   node research/sensitivity.js DIR --a verdict --b rule [--factor format] [--outcome shock.alive ...]
//
// DIR is a run of a sampling design (research/designs/sensitivity.json): many
// points of parameter space, each crossed with the levels of one factor, all
// on the same seeds. For every point, the effect is the mean paired difference
// a − b over its seeds. Across points it says:
//   - how often the effect keeps its sign (robust if nearly always);
//   - its mean and 95% interval over the points;
//   - which parameters it depends on: Spearman's rank correlation between the
//     effect and each sampled parameter.

import { writeFileSync } from 'node:fs';
import { collect, OUTCOMES } from './analyze.js';
import { mean, bootstrapCI } from './stats.js';

function ranks(xs) {
  const order = xs.map((x, i) => [x, i]).sort((p, q) => p[0] - q[0]);
  const r = new Array(xs.length);
  for (let i = 0; i < order.length;) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    for (let k = i; k <= j; k++) r[order[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return r;
}

export function spearman(xs, ys) {
  const rx = ranks(xs);
  const ry = ranks(ys);
  const mx = mean(rx);
  const my = mean(ry);
  let num = 0; let dx = 0; let dy = 0;
  for (let i = 0; i < xs.length; i++) {
    num += (rx[i] - mx) * (ry[i] - my);
    dx += (rx[i] - mx) ** 2;
    dy += (ry[i] - my) ** 2;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
}

// Effect per point: [{ point, params: {...}, effect }].
export function effects(data, { factor, a, b, outcome }) {
  const params = Object.keys(data.design.sample.ranges);
  const byPoint = new Map();
  for (const c of data.cells) {
    const k = c.cell.point;
    if (!byPoint.has(k)) byPoint.set(k, {});
    byPoint.get(k)[c.cell[factor]] = c;
  }
  const out = [];
  for (const [point, cs] of byPoint) {
    const ca = cs[a];
    const cb = cs[b];
    if (!ca || !cb) continue;
    const diffs = ca.seeds.filter((s) => cb.seeds.includes(s))
      .map((s) => ca.values[outcome][ca.seeds.indexOf(s)] - cb.values[outcome][cb.seeds.indexOf(s)])
      .filter(Number.isFinite);
    if (!diffs.length) continue;
    out.push({ point, params: Object.fromEntries(params.map((p) => [p, ca.cell[p]])), effect: mean(diffs) });
  }
  return out;
}

export function report(data, { factor, a, b, outcome }) {
  const es = effects(data, { factor, a, b, outcome });
  const xs = es.map((e) => e.effect);
  const [lo, hi] = bootstrapCI(xs);
  const pos = xs.filter((x) => x > 0).length;
  const neg = xs.filter((x) => x < 0).length;
  const L = [`### ${outcome}: ${a} − ${b} over ${es.length} points`];
  L.push(`mean ${mean(xs).toFixed(3)} [${lo.toFixed(3)}, ${hi.toFixed(3)}] · positive at ${pos} points, negative at ${neg}\n`);
  L.push('| parameter | Spearman ρ with the effect |');
  L.push('|---|---|');
  const rows = Object.keys(data.design.sample.ranges)
    .map((p) => [p, spearman(es.map((e) => e.params[p]), xs)])
    .sort((x, y) => Math.abs(y[1]) - Math.abs(x[1]));
  for (const [p, rho] of rows) L.push(`| ${p} | ${rho.toFixed(2)} |`);
  return L.join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  const dir = argv[0];
  const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);
  const factor = opt('--factor', 'format');
  const a = opt('--a', null);
  const b = opt('--b', null);
  if (!dir || !a || !b) throw new Error('usage: node research/sensitivity.js DIR --a LEVEL --b LEVEL [--factor F] [--outcome O ...]');
  const outcomes = argv.flatMap((x, i) => (x === '--outcome' ? [argv[i + 1]] : []));
  const data = collect(dir);
  const text = [`## Sensitivity (${data.design.name}): ${factor} ${a} − ${b}\n`,
    ...(outcomes.length ? outcomes : OUTCOMES).map((o) => report(data, { factor, a, b, outcome: o }))].join('\n\n');
  writeFileSync(`${dir}/sensitivity-${a}-${b}.md`, `${text}\n`);
  console.log(text);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  try { main(); } catch (e) { console.error(e.message); process.exit(1); }
}
