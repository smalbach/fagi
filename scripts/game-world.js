#!/usr/bin/env node
// The game's world, run without a screen: does it press on them?
//
// The game's own settings (src/app/organism-on.js: three colonies of up to 30,
// seasons, the evolving body, fruit that weighs), a few years per map, every
// map a different one. For each nest and each year: how many live, what they
// die of, whether it empties and is refounded. A world presses when what
// limits a colony is food and cold, not the ceiling on the nest: then what
// they learn and inherit can matter.
//
//   node scripts/game-world.js [--interval 8,24,48] [--seeds 4] [--seed 7000]
//                              [--years 3] [--jobs 16] [--set A.b=V]... [--json FILE]

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DT = 0.1;
const WHERE = fileURLToPath(import.meta.url);

async function life({ interval, seed, years, sets }) {
  await import('../src/app/organism-on.js');
  const CONFIG = await import('../src/config.js');
  const { applySets } = await import('./batch/args.js');
  const { createWorld, nestsOf } = await import('../src/world.js');
  const { generateMap } = await import('../src/mapgen.js');
  const { stepWorld } = await import('../src/simulation.js');
  const { createColony, updateColony } = await import('../src/colony.js');
  const { rng, withRng } = await import('./batch/random.js');
  const { habitatOfNest } = await import('../src/habitats.js');
  const { programOf } = await import('../src/program.js');

  CONFIG.TREE.interval = interval;
  applySets(sets);
  const year = CONFIG.SEASONS.year;
  const world = withRng(rng(seed * 31 + 7), () => { const w = createWorld(); generateMap(w); return w; });
  const antRng = rng(seed);
  const worldRng = rng(seed * 7919);
  const colony = withRng(antRng, () => createColony(CONFIG.LIFE.founders));
  world.colony = colony;
  const nests = nestsOf(world);
  const first = nests[0];
  for (const f of colony.ants) { f.x = first.x; f.y = first.y; }

  const homeOf = (f) => f.home ?? first.id;
  const blank = () => ({ alive: [], deaths: {}, emptied: 0 });
  const rows = [];   // one per nest per year
  let per = Object.fromEntries(nests.map((n) => [n.id, blank()]));
  const seen = new Set();
  const wasEmpty = {};
  const sampleEvery = Math.round(60 / DT);
  const steps = Math.ceil((years * year) / DT);
  for (let s = 1; s <= steps; s++) {
    withRng(worldRng, () => stepWorld(world, DT));
    withRng(antRng, () => updateColony(world, colony, DT));
    for (const f of colony.ants) {
      if (f.alive || seen.has(f)) continue;
      seen.add(f);
      const d = per[homeOf(f)]?.deaths;
      if (d) d[f.cause || 'unknown'] = (d[f.cause || 'unknown'] ?? 0) + 1;
    }
    if (s % sampleEvery === 0) {
      for (const n of nests) {
        const k = colony.ants.filter((f) => f.alive && homeOf(f) === n.id).length;
        per[n.id].alive.push(k);
        const empty = !k && !n.eggs?.length;
        if (empty && !wasEmpty[n.id]) per[n.id].emptied++;
        wasEmpty[n.id] = empty;
      }
    }
    if (s % Math.round(year / DT) === 0) {
      const y = Math.round((s * DT) / year);
      for (const n of nests) {
        const p = per[n.id];
        const a = p.alive;
        const here = colony.ants.filter((f) => f.alive && homeOf(f) === n.id);
        rows.push({
          traits: traitsOf(here, programOf),
          seed, interval, year: y, nest: n.id, habitat: habitatOfNest(world, n)?.name ?? null,
          mean: +(a.reduce((x, v) => x + v, 0) / a.length).toFixed(1),
          min: Math.min(...a), end: a.at(-1), deaths: p.deaths, emptied: p.emptied,
        });
      }
      per = Object.fromEntries(nests.map((n) => [n.id, blank()]));
    }
  }
  return { seed, interval, rows, founded: colony.life?.founded ?? 0, eggsLost: colony.life?.eggsLost ?? {} };
}

// What the living of one nest carry: organ genes and bodies (MORPH), the
// epigenetic mark, and the lines of conduct that are not the born ones —
// written by herself, inherited, told by a sister.
const ORGANS = ['brain', 'gut', 'muscle', 'eyes', 'antennae', 'size'];
function traitsOf(ants, programOf) {
  if (!ants.length) return null;
  const mean = (xs) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(3) : null);
  const out = { n: ants.length };
  for (const k of ORGANS) {
    out[`gene.${k}`] = mean(ants.map((f) => f.genome?.morph?.[k]).filter(Number.isFinite));
    out[`body.${k}`] = mean(ants.map((f) => f.morph?.[k]).filter(Number.isFinite));
    out[`epi.${k}`] = mean(ants.map((f) => f.epi?.[k] ?? f.genome?.epi?.[k]).filter(Number.isFinite));
  }
  const lines = ants.map((f) => programOf(f).lines.filter((l) => !l.retired && l.source !== 'born'));
  out.ownLines = mean(lines.map((ls) => ls.length));
  out.inheritedLines = mean(lines.map((ls) => ls.filter((l) => l.source === 'inherited').length));
  const kinds = {};
  for (const ls of lines) for (const l of ls) { const k = `${l.from}>${l.over}`; kinds[k] = (kinds[k] ?? 0) + 1; }
  out.topLines = Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}:${v}`);
  return out;
}

if (!isMainThread) {
  parentPort.postMessage(await life(workerData));
} else {
  const argv = process.argv.slice(2);
  const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
  const intervals = String(arg('interval', '8')).split(',').map(Number);
  const SEEDS = Number(arg('seeds', 4));
  const SEED0 = Number(arg('seed', 7000));
  const YEARS = Number(arg('years', 3));
  const JOBS = Number(arg('jobs', Math.max(1, availableParallelism() - 2)));
  const OUT = arg('json', null);
  const sets = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== '--set') continue;
    const [k, v] = argv[i + 1].split('=');
    let val; try { val = JSON.parse(v); } catch { val = v; }
    sets.push([k.split('.'), val]);
  }

  const tasks = intervals.flatMap((interval) => Array.from({ length: SEEDS }, (_, i) => ({ interval, seed: SEED0 + i, years: YEARS, sets })));
  const results = [];
  let next = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: Math.min(JOBS, tasks.length) }, async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      const r = await new Promise((ok, fail) => {
        const w = new Worker(WHERE, { workerData: task });
        w.once('message', ok);
        w.once('error', fail);
      });
      results.push(r);
      process.stderr.write(`  interval ${task.interval} seed ${task.seed} done (${Math.round((Date.now() - t0) / 1000)} s)\n`);
    }
  }));

  const rows = results.flatMap((r) => r.rows);
  const sum = (xs) => xs.reduce((a, b) => a + b, 0);
  const cap = sets.find(([k]) => k.join('.') === 'LIFE.maxPopulation')?.[1] ?? 30;
  console.log(`\nyears ${YEARS}, ${SEEDS} maps each, nest ceiling ${cap}\n`);
  console.log('| fruit every | habitat | mean alive (% ceiling) | lowest | emptied nest-years | deaths: hunger / thirst / cold / heat / age / other |');
  console.log('|---|---|---|---|---|---|');
  for (const interval of intervals) {
    const mine = rows.filter((r) => r.interval === interval);
    const groups = [...new Set(mine.map((r) => r.habitat ?? '—'))];
    for (const h of groups) {
      const g = mine.filter((r) => (r.habitat ?? '—') === h);
      const d = {};
      for (const r of g) for (const [k, v] of Object.entries(r.deaths)) d[k] = (d[k] ?? 0) + v;
      const other = sum(Object.entries(d).filter(([k]) => !['hunger', 'thirst', 'cold', 'heat', 'age'].includes(k)).map(([, v]) => v));
      const m = sum(g.map((r) => r.mean)) / g.length;
      console.log(`| ${interval} s | ${h} | ${m.toFixed(1)} (${Math.round((100 * m) / cap)} %) | ${Math.min(...g.map((r) => r.min))} | ${g.filter((r) => r.emptied).length}/${g.length} | ${d.hunger ?? 0} / ${d.thirst ?? 0} / ${d.cold ?? 0} / ${d.heat ?? 0} / ${d.age ?? 0} / ${other} |`);
    }
    const founded = sum(results.filter((r) => r.interval === interval).map((r) => r.founded));
    console.log(`|  | refounded nests: ${founded} | | | | |`);
  }
  const last = rows.filter((r) => r.year === YEARS && r.traits);
  if (last.length) {
    console.log(`\nwhat the living carry at the end of year ${YEARS} (mean over nests)\n`);
    console.log('| fruit every | habitat | size gene / body | muscle gene / body | gut gene / body | epi size | own lines | inherited lines | commonest |');
    console.log('|---|---|---|---|---|---|---|---|---|');
    for (const interval of intervals) {
      const mine = last.filter((r) => r.interval === interval);
      for (const h of [...new Set(mine.map((r) => r.habitat ?? '—'))]) {
        const g = mine.filter((r) => (r.habitat ?? '—') === h).map((r) => r.traits);
        const m = (k) => { const v = g.map((t) => t[k]).filter(Number.isFinite); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(3) : '—'; };
        const top = {};
        for (const t of g) for (const e of t.topLines) { const [k, v] = e.split(':'); top[k] = (top[k] ?? 0) + Number(v); }
        const commonest = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).join(', ') || '—';
        console.log(`| ${interval} s | ${h} | ${m('gene.size')} / ${m('body.size')} | ${m('gene.muscle')} / ${m('body.muscle')} | ${m('gene.gut')} / ${m('body.gut')} | ${m('epi.size')} | ${m('ownLines')} | ${m('inheritedLines')} | ${commonest} |`);
      }
    }
  }
  if (OUT) writeFileSync(OUT, JSON.stringify({ intervals, seeds: SEEDS, seed0: SEED0, years: YEARS, sets, results }, null, 1));
}
