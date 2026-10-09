// Where the step 3 campaign stands (step3-protocolo.md): per condition and
// lineage, the population against 'current' early and late, and the
// transplant of every finished lineage, if run.
//
//   node research/code-culture/campaign-status.js

import { existsSync, readdirSync, readFileSync } from 'node:fs';

const BASE = 'research/results/code-culture';
const RUNS = ['full-tournament', 'full-random', 'full-blind-tournament', 'full-blind-random'];
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const f3 = (x) => (Number.isNaN(x) ? '—' : `${x >= 0 ? '+' : ''}${x.toFixed(3)}`);

for (const run of RUNS) {
  const dir = `${BASE}/lineages/${run}`;
  if (!existsSync(`${dir}/run.json`)) { console.log(`\n## ${run}: not started`); continue; }
  const { G } = JSON.parse(readFileSync(`${dir}/run.json`, 'utf8'));
  const gens = {};
  for (const f of readdirSync(dir)) {
    const m = f.match(/^r(\d+)-g(\d+)\.json$/);
    if (!m) continue;
    const { lives } = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
    (gens[m[1]] ??= [])[Number(m[2])] = mean(lives.map((l) => l.survival - l.current));
  }
  const rs = Object.keys(gens).map(Number).sort((a, b) => a - b);
  const done = rs.filter((r) => gens[r][G - 1] != null);
  console.log(`\n## ${run}: ${done.length}/10 lineages finished${rs.length > done.length ? `, lineage ${rs.at(-1)} at generation ${gens[rs.at(-1)].length - 1}` : ''}`);
  console.log('| lineage | g1–9 | g10–14 | g15–19 | transplant − current |');
  console.log('|---|---|---|---|---|');
  // Transplant results, by lineage, if any.
  const tdir = `${BASE}/transplant`;
  const cur = (i) => JSON.parse(readFileSync(`${tdir}/current/${i}.json`, 'utf8')).survival;
  const trans = {};
  if (existsSync(tdir)) for (const d of readdirSync(tdir)) {
    const m = d.match(new RegExp(`^${run}-r(\\d+)-`));
    if (!m) continue;
    const files = readdirSync(`${tdir}/${d}`).filter((f) => /^5\d{3}\.json$/.test(f));
    if (files.length < 120) continue;
    trans[m[1]] = mean(files.map((f) => JSON.parse(readFileSync(`${tdir}/${d}/${f}`, 'utf8')).survival - cur(f.slice(0, -5))));
  }
  const col = { early: [], mid: [], late: [], t: [] };
  for (const r of rs) {
    const x = gens[r];
    const e = mean(x.slice(1, 10).filter((v) => v != null)), m = mean(x.slice(10, 15).filter((v) => v != null)), l = mean(x.slice(15, 20).filter((v) => v != null));
    const t = trans[r] ?? NaN;
    if (!Number.isNaN(e)) col.early.push(e); if (!Number.isNaN(m)) col.mid.push(m); if (!Number.isNaN(l)) col.late.push(l); if (!Number.isNaN(t)) col.t.push(t);
    console.log(`| ${r} | ${f3(e)} | ${f3(m)} | ${f3(l)} | ${f3(t)} |`);
  }
  console.log(`| mean | ${f3(mean(col.early))} | ${f3(mean(col.mid))} | ${f3(mean(col.late))} | ${f3(mean(col.t))} (n ${col.t.length}) |`);
}
