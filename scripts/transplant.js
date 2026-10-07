#!/usr/bin/env node
// A reciprocal transplant in the game's world: are colonies adapted to where
// they live?
//
// The game's own settings (src/app/organism-on.js), three colonies each in a
// habitat of its own. For `--years` years they live and breed as in the game.
// Then, for `--window` seconds, every newborn is cross-fostered at hatching:
// with chance 1/3 she stays in her mother's nest, else she is raised in one of
// the other two (she becomes theirs: her home, her pantry). She carries what
// she was born with — genes, the epigenetic mark, her mother's lines of
// conduct — into the place she grows up in. Each one is followed until she
// dies or `--follow` seconds after the window closes.
//
// Local adaptation (Kawecki & Ebert 2004, "local vs foreign"): in each
// habitat, those born there do better than immigrants raised there beside
// them. Fitness: reaching adulthood, days lived, and daughters and sons left.
// Before the window, what each colony carries (organs, mark, lines) is
// reported too: do the habitats pull them apart?
//
//   node scripts/transplant.js [--seeds 16] [--seed 7300] [--years 4]
//                              [--window 3600] [--follow 5400] [--jobs 16]
//                              [--set A.b=V]... [--json FILE]

import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { availableParallelism } from 'node:os';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DT = 0.1;
const WHERE = fileURLToPath(import.meta.url);
const ORGANS = ['brain', 'gut', 'muscle', 'eyes', 'antennae', 'size'];

async function life({ seed, years, window, follow, sets }) {
  await import('../src/app/organism-on.js');
  const CONFIG = await import('../src/config.js');
  const { applySets } = await import('./batch/args.js');
  const { createWorld, nestsOf } = await import('../src/world.js');
  const { generateMap } = await import('../src/mapgen.js');
  const { stepWorld } = await import('../src/simulation.js');
  const { createColony, updateColony } = await import('../src/colony.js');
  const { programOf } = await import('../src/program.js');
  const { rng, withRng } = await import('./batch/random.js');

  applySets(sets);
  const world = withRng(rng(seed * 31 + 7), () => { const w = createWorld(); generateMap(w); return w; });
  const antRng = rng(seed);
  const worldRng = rng(seed * 7919);
  const fosterRng = rng(seed * 104729 + 3);   // its own stream: who goes where
  const colony = withRng(antRng, () => createColony(CONFIG.LIFE.founders));
  world.colony = colony;
  const nests = nestsOf(world);
  for (const f of colony.ants) { f.x = nests[0].x; f.y = nests[0].y; }
  const habitatOf = Object.fromEntries(nests.map((n) => [n.id, n.habitat]));
  const homeOf = (f) => f.home ?? nests[0].id;

  const step = () => {
    withRng(worldRng, () => stepWorld(world, DT));
    withRng(antRng, () => updateColony(world, colony, DT));
  };

  // 1. They live where they are.
  const evolveSteps = Math.round((years * CONFIG.SEASONS.year) / DT);
  for (let s = 0; s < evolveSteps; s++) step();

  const carried = {};
  for (const n of nests) {
    const here = colony.ants.filter((f) => f.alive && homeOf(f) === n.id && f.lifeStage !== 'juvenile');
    const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    const t = { n: here.length };
    for (const k of ORGANS) {
      t[`gene.${k}`] = mean(here.map((f) => f.genome?.morph?.[k]).filter(Number.isFinite));
      t[`body.${k}`] = mean(here.map((f) => f.morph?.[k]).filter(Number.isFinite));
      t[`epi.${k}`] = mean(here.map((f) => f.genome?.epi?.[k] ?? f.epi?.[k]).filter(Number.isFinite));
    }
    const lines = here.map((f) => programOf(f).lines.filter((l) => !l.retired && l.source !== 'born'));
    t.ownLines = mean(lines.map((ls) => ls.length));
    const kinds = {};
    for (const ls of lines) for (const l of ls) { const k = `${l.from}>${l.over}`; kinds[k] = (kinds[k] ?? 0) + 1; }
    t.lines = kinds;
    carried[n.habitat] = t;
  }

  // 2. Every newborn of the window is cross-fostered at hatching.
  const seen = new Set(colony.ants.map((f) => f.id));
  const cohort = [];   // { id, born, raised, at }
  const windowEnd = world.time + window;
  const end = windowEnd + follow;
  while (world.time < end) {
    step();
    if (world.time > windowEnd) continue;
    for (const f of colony.ants) {
      if (seen.has(f.id)) continue;
      seen.add(f.id);
      if (!f.alive || f.lifeStage !== 'juvenile') continue;
      const born = homeOf(f);
      const r = fosterRng();
      const others = nests.filter((n) => n.id !== born);
      const to = r < 1 / 3 ? nests.find((n) => n.id === born) : others[r < 2 / 3 ? 0 : 1];
      if (to.id !== born) {
        f.home = to.id;
        f.pantry = {};
        f.x = to.x;
        f.y = to.y;
      }
      cohort.push({ id: f.id, born: habitatOf[born], raised: habitatOf[to.id], at: world.time });
    }
  }

  // 3. How each one did.
  const kids = {};
  for (const v of Object.values(world.lineage)) for (const p of [v.mother, v.father]) if (p != null) kids[p] = (kids[p] ?? 0) + 1;
  const byId = new Map(colony.ants.map((f) => [f.id, f]));
  const fates = cohort.map((c) => {
    const f = byId.get(c.id);
    return {
      ...c,
      adult: f.lifeStage !== 'juvenile' || (f.age ?? 0) >= CONFIG.LIFE.adultAt,
      lived: Math.round(f.age ?? 0),
      alive: f.alive,
      cause: f.alive ? null : f.cause,
      offspring: kids[c.id] ?? 0,
      size: f.morph?.size ?? null,
    };
  });
  return { seed, habitats: nests.map((n) => n.habitat), carried, fates, founded: colony.life?.founded ?? 0 };
}

if (!isMainThread) {
  parentPort.postMessage(await life(workerData));
} else {
  const argv = process.argv.slice(2);
  const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
  const SEEDS = Number(arg('seeds', 16));
  const SEED0 = Number(arg('seed', 7300));
  const YEARS = Number(arg('years', 4));
  const WINDOW = Number(arg('window', 3600));
  const FOLLOW = Number(arg('follow', 5400));
  const JOBS = Number(arg('jobs', Math.max(1, availableParallelism() - 2)));
  const OUT = arg('json', null);
  const sets = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== '--set') continue;
    const [k, v] = argv[i + 1].split('=');
    let val; try { val = JSON.parse(v); } catch { val = v; }
    sets.push([k.split('.'), val]);
  }

  const tasks = Array.from({ length: SEEDS }, (_, i) => ({ seed: SEED0 + i, years: YEARS, window: WINDOW, follow: FOLLOW, sets }));
  const results = [];
  let next = 0;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: Math.min(JOBS, tasks.length) }, async () => {
    while (next < tasks.length) {
      const task = tasks[next++];
      results.push(await new Promise((ok, fail) => {
        const w = new Worker(WHERE, { workerData: task });
        w.once('message', ok);
        w.once('error', fail);
      }));
      process.stderr.write(`  seed ${task.seed} done (${Math.round((Date.now() - t0) / 1000)} s)\n`);
    }
  }));
  results.sort((a, b) => a.seed - b.seed);
  if (OUT) writeFileSync(OUT, JSON.stringify({ seeds: SEEDS, seed0: SEED0, years: YEARS, window: WINDOW, follow: FOLLOW, sets, results }, null, 1));
  report(results);
}

function report(results) {
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
  const sd = (xs) => { const m = mean(xs); return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1)); };
  const f2 = (v) => (Number.isFinite(v) ? v.toFixed(2) : '—');
  const f3 = (v) => (Number.isFinite(v) ? v.toFixed(3) : '—');
  const kinds = [...new Set(results.flatMap((r) => r.habitats))];

  console.log(`\n${results.length} maps; colonies refounded during the run: ${results.reduce((a, r) => a + r.founded, 0)}\n`);
  console.log('## What each colony carries before the transplant (adults)\n');
  console.log('| habitat | adults | size gene / body / mark | muscle gene / body | gut gene / body | own lines | commonest lines |');
  console.log('|---|---|---|---|---|---|---|');
  for (const h of kinds) {
    const c = results.map((r) => r.carried[h]).filter((t) => t?.n);
    const m = (k) => mean(c.map((t) => t[k]).filter(Number.isFinite));
    const lines = {};
    for (const t of c) for (const [k, v] of Object.entries(t.lines)) lines[k] = (lines[k] ?? 0) + v;
    const top = Object.entries(lines).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).join(', ') || '—';
    console.log(`| ${h} | ${f2(mean(c.map((t) => t.n)))} (${c.length} maps) | ${f3(m('gene.size'))} / ${f3(m('body.size'))} / ${f3(m('epi.size'))} | ${f3(m('gene.muscle'))} / ${f3(m('body.muscle'))} | ${f3(m('gene.gut'))} / ${f3(m('body.gut'))} | ${f2(m('ownLines'))} | ${top} |`);
  }

  // Paired by map: in each habitat, residents born there minus immigrants
  // raised there; then averaged over habitats (the local-vs-foreign contrast).
  const measures = { adult: (f) => (f.adult ? 1 : 0), lived: (f) => f.lived / 180, offspring: (f) => f.offspring };
  console.log('\n## Raised where: born here (local) vs born elsewhere (foreign), same habitat, same time\n');
  console.log('| raised in | measure | local | foreign | local − foreign | maps local ahead |');
  console.log('|---|---|---|---|---|---|');
  const overall = {};
  for (const [name, fn] of Object.entries(measures)) {
    overall[name] = [];
    for (const h of kinds) {
      const diffs = [];
      const loc = [];
      const for_ = [];
      for (const r of results) {
        const here = r.fates.filter((f) => f.raised === h);
        const a = here.filter((f) => f.born === h).map(fn);
        const b = here.filter((f) => f.born !== h).map(fn);
        if (a.length < 2 || b.length < 2) continue;
        loc.push(mean(a)); for_.push(mean(b));
        diffs.push(mean(a) - mean(b));
      }
      for (const [i, d] of diffs.entries()) (overall[name][i] ??= []).push(d);
      console.log(`| ${h} | ${name} | ${f2(mean(loc))} | ${f2(mean(for_))} | ${f2(mean(diffs))} | ${diffs.filter((d) => d > 0).length}/${diffs.length} |`);
    }
  }
  // Per map, the contrast averaged over the habitats it could be measured in.
  console.log('\n## Local adaptation, all habitats together (per map, then over maps)\n');
  console.log('| measure | local − foreign | t | maps local ahead |');
  console.log('|---|---|---|---|');
  for (const name of Object.keys(measures)) {
    const per = [];
    for (const r of results) {
      const ds = [];
      for (const h of kinds) {
        const here = r.fates.filter((f) => f.raised === h);
        const a = here.filter((f) => f.born === h).map(measures[name]);
        const b = here.filter((f) => f.born !== h).map(measures[name]);
        if (a.length >= 2 && b.length >= 2) ds.push(mean(a) - mean(b));
      }
      if (ds.length) per.push(mean(ds));
    }
    const t = mean(per) / (sd(per) / Math.sqrt(per.length));
    console.log(`| ${name} | ${f3(mean(per))} | ${f2(t)} | ${per.filter((d) => d > 0).length}/${per.length} |`);
  }
  // Home vs away for each source: the same lineage, here and there.
  console.log('\n## Born where: raised at home vs away\n');
  console.log('| born in | home: adult / days / offspring | away: adult / days / offspring | n home / away |');
  console.log('|---|---|---|---|');
  for (const h of kinds) {
    const all = results.flatMap((r) => r.fates.filter((f) => f.born === h));
    const home = all.filter((f) => f.raised === h);
    const away = all.filter((f) => f.raised !== h);
    const s = (g) => `${f2(mean(g.map(measures.adult)))} / ${f2(mean(g.map(measures.lived)))} / ${f2(mean(g.map(measures.offspring)))}`;
    console.log(`| ${h} | ${s(home)} | ${s(away)} | ${home.length} / ${away.length} |`);
  }
}
