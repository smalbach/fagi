// The research site's game figures (investigacion/data/game.json), from the
// JSON written by the game's own runs:
//
//   node scripts/game-world.js --interval 30 --seeds 8 --seed 7500 --years 20 --json world.json
//   node scripts/transplant.js --seeds 12 --seed 7400 --years 3 --json transplant.json
//   node scripts/site-game-data.js --world world.json --transplant transplant.json
//
// Evolution: per habitat and year, the mean over maps of what the living of
// that nest carry (organ genes). Transplant: per habitat where they were
// raised, offspring of those born there vs those brought from elsewhere
// (mean over maps of each map's means, as scripts/transplant.js reports it).

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : null;
};
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const sd = (xs) => { const m = mean(xs); return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1)); };
const r3 = (v) => (v == null ? null : Math.round(v * 1000) / 1000);
const GENES = ['muscle', 'brain', 'size'];

const world = JSON.parse(readFileSync(arg('world'), 'utf8'));
const rows = world.results.flatMap((r) => r.rows);
const habitats = [...new Set(rows.map((r) => r.habitat).filter(Boolean))].sort();
const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);

const evolution = { years, habitats, genes: {}, alive: {} };
for (const g of GENES) {
  evolution.genes[g] = {};
  for (const h of habitats) {
    evolution.genes[g][h] = years.map((y) => r3(mean(rows
      .filter((r) => r.habitat === h && r.year === y && r.traits?.[`gene.${g}`] != null)
      .map((r) => r.traits[`gene.${g}`]))));
  }
}
for (const h of habitats) {
  evolution.alive[h] = years.map((y) => r3(mean(rows.filter((r) => r.habitat === h && r.year === y).map((r) => r.mean))));
}
// Year 1 to the last, per map (all nests of the map pooled), as the docs report it.
evolution.change = {};
for (const g of GENES) {
  const per = world.results.map((r) => {
    const at = (y) => mean(r.rows.filter((x) => x.year === y && x.traits?.[`gene.${g}`] != null).map((x) => x.traits[`gene.${g}`]));
    const a = at(1), b = at(years.at(-1));
    return a != null && b != null ? b - a : null;
  }).filter((d) => d != null);
  evolution.change[g] = { mean: r3(mean(per)), t: r3(mean(per) / (sd(per) / Math.sqrt(per.length))), up: per.filter((d) => d > 0).length, maps: per.length };
}

const tp = JSON.parse(readFileSync(arg('transplant'), 'utf8'));
const kinds = [...new Set(tp.results.flatMap((r) => r.habitats))].sort();
const transplant = { habitats: kinds, local: [], foreign: [], maps: [] };
const perMap = [];
for (const h of kinds) {
  const loc = [], fo = [];
  for (const r of tp.results) {
    const here = r.fates.filter((f) => f.raised === h);
    const a = here.filter((f) => f.born === h).map((f) => f.offspring);
    const b = here.filter((f) => f.born !== h).map((f) => f.offspring);
    if (a.length < 2 || b.length < 2) continue;
    loc.push(mean(a)); fo.push(mean(b));
  }
  transplant.local.push(r3(mean(loc)));
  transplant.foreign.push(r3(mean(fo)));
  transplant.maps.push(loc.length);
}
for (const r of tp.results) {
  const ds = [];
  for (const h of kinds) {
    const here = r.fates.filter((f) => f.raised === h);
    const a = here.filter((f) => f.born === h).map((f) => f.offspring);
    const b = here.filter((f) => f.born !== h).map((f) => f.offspring);
    if (a.length >= 2 && b.length >= 2) ds.push(mean(a) - mean(b));
  }
  if (ds.length) perMap.push(mean(ds));
}
transplant.overall = { diff: r3(mean(perMap)), t: r3(mean(perMap) / (sd(perMap) / Math.sqrt(perMap.length))), localAhead: perMap.filter((d) => d > 0).length, maps: perMap.length };

const out = {
  commit: (() => { try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return ''; } })(),
  world: { seeds: [world.seed0, world.seed0 + world.seeds - 1], years: world.years, intervals: world.intervals },
  transplantDesign: { seeds: [tp.seed0, tp.seed0 + tp.seeds - 1], years: tp.years, window: tp.window, follow: tp.follow },
  evolution, transplant,
};
writeFileSync(new URL('../investigacion/data/game.json', import.meta.url), JSON.stringify(out));
console.log(JSON.stringify({ change: evolution.change, transplant }, null, 1));
