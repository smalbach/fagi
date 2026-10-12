#!/usr/bin/env node
// A century of the game's world growing with its people (GROWTH), recorded to
// be replayed. Not a study: one long run to watch.
//
// The game's world (src/app/organism-on.js) with GROWTH on: nests bud, males
// disperse, the map grows up to --max × the base map's side. Every year it
// writes, in <out>/years/:
//
//   NNNN.start.json.gz   the world as the year begins: map size, every object
//                        and food point, every living Fagi (who she is, where)
//   NNNN.events.jsonl.gz everything that changed, in order, one JSON per line:
//                        the world's own events (world.rec: obj_add, point_add,
//                        hatch, colony_found, map_grow, disperse...) minus the
//                        pheromone drops, plus `death` for every Fagi that dies
//   NNNN.frames.bin.gz   where every living Fagi is, every --sample s (below)
//   NNNN.json            the year in numbers
//
// and, after each year, <out>/checkpoint.bin.gz: the whole state (world,
// colony, random streams). Run it again with the same --out and it goes on
// from the last finished year.
//
// Frames: per frame a Float64 t and a Uint32 n, then n records of 12 bytes:
// Uint32 id, Uint16 x, Uint16 y (px), Uint8 heading (×256/2π), Uint8 action
// (index in that year's NNNN.json `actions`, the list only grows; 255 = past 254), Uint8 flags (1 juvenile,
// 2 carrying, 4 in her nest, 8 male), Uint8 nest index (in index.json's
// NNNN.json `nestIds`; 255 = none or past 254). Little-endian.
//
//   node scripts/century.js --out research/century [--years 100] [--seed 60000]
//     [--max 5] [--sample 5] [--set GROWTH.budAt=0.3]...

import { mkdirSync, existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import v8 from 'node:v8';

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
const sets = argv.flatMap((a, i) => (a === '--set' ? [argv[i + 1]] : []));
const OUT = arg('out');
if (!OUT) throw new Error('usage: century.js --out <dir> [--years 100] [--seed 60000] [--max 5] [--sample 5]');
const YEARS = Number(arg('years', 100));
const SEED = Number(arg('seed', 60000));
const MAX = Number(arg('max', 5));
const SAMPLE = Number(arg('sample', 5));
const DT = 0.1;

await import('../src/app/organism-on.js');
const C = await import('../src/config.js');
const { applySets } = await import('./batch/args.js');
const { createWorld, nestsOf, nestOf, sizeWorld } = await import('../src/world.js');
const { generateMap } = await import('../src/mapgen.js');
const { stepWorld } = await import('../src/simulation.js');
const { createColony, updateColony } = await import('../src/colony.js');
const { withRng } = await import('./batch/random.js');
const { radiusOf } = await import('../src/obstacles.js');

C.TREE.interval = 30;
C.GROWTH.enabled = 1;
C.GROWTH.max = MAX;
applySets(sets);
const YEAR = C.SEASONS.year;

// Random streams whose state is plain data, so a checkpoint carries them
// (mulberry32, as scripts/batch/random.js).
const stream = (seed) => ({ s: seed >>> 0 });
const drawFrom = (st) => () => {
  st.s = (st.s + 0x6D2B79F5) >>> 0;
  let t = st.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const YEARS_DIR = join(OUT, 'years');
mkdirSync(YEARS_DIR, { recursive: true });
const CHECKPOINT = join(OUT, 'checkpoint.bin.gz');
const pad = (y) => String(y).padStart(4, '0');
const writeAtomic = (path, data) => { writeFileSync(`${path}.tmp`, data); renameSync(`${path}.tmp`, path); };

// The state: a new world, or the last checkpoint.
let state;
if (existsSync(CHECKPOINT)) {
  state = v8.deserialize(gunzipSync(readFileSync(CHECKPOINT)));
  // The map's size lives in WORLD too (movement, exploring read it there).
  sizeWorld(state.world, state.world.width / C.WORLD.baseWidth);
  console.log(`resuming at year ${state.year + 1} of ${YEARS}`);
} else {
  const mapStream = stream(SEED * 31 + 7);
  const world = withRng(drawFrom(mapStream), () => { const w = createWorld(); generateMap(w); return w; });
  const ants = stream(SEED);
  const colony = withRng(drawFrom(ants), () => createColony(C.LIFE.founders));
  world.colony = colony;
  const first = nestsOf(world)[0];
  for (const f of colony.ants) { f.x = first.x; f.y = first.y; }
  state = { world, colony, streams: { world: stream(SEED * 7919), ants }, year: 0, seed: SEED, max: MAX, sets, actions: [] };
  writeFileSync(join(OUT, 'index.json'), JSON.stringify({
    seed: SEED, years: YEARS, max: MAX, sample: SAMPLE, dt: DT, year: YEAR, sets,
    base: { width: C.WORLD.baseWidth, height: C.WORLD.baseHeight },
    started: new Date().toISOString(),
  }, null, 2));
}
const { world, colony } = state;
const worldDraw = drawFrom(state.streams.world);
const antDraw = drawFrom(state.streams.ants);

const actionCode = (a) => {
  let i = state.actions.indexOf(a ?? 'none');
  if (i < 0) { state.actions.push(a ?? 'none'); i = state.actions.length - 1; }
  return Math.min(255, i);
};

const homeOf = (f) => f.home ?? nestsOf(world)[0]?.id;
const who = (f) => ({ id: f.id, name: f.name, sex: f.sex, generation: f.generation ?? 0, home: homeOf(f), stage: f.lifeStage, x: Math.round(f.x), y: Math.round(f.y), mother: world.lineage?.[f.id]?.mother ?? null, father: world.lineage?.[f.id]?.father ?? null });
const thing = (o) => ({ id: o.id, what: o.type, x: Math.round(o.x * 10) / 10, y: Math.round(o.y * 10) / 10, r: radiusOf(o), ...(o.fruit ? { fruit: o.fruit } : {}), ...(o.habitat ? { habitat: o.habitat } : {}), ...(o.life ? { life: o.life, age: Math.round(o.age ?? 0) } : {}) });

const SKIP = new Set(['phero_drop', 'wind', 'mud_tread', 'day']);

function runYear(y) {
  const events = [];
  const frames = [];
  let frameBytes = 0;
  const nests = nestsOf(world).map((n) => n.id);
  const nestIndex = (id) => { let i = nests.indexOf(id); if (i < 0 && id != null) { nests.push(id); i = nests.length - 1; } return i < 0 || i > 254 ? 255 : i; };
  world.rec = { emit: (type, data) => { if (!SKIP.has(type)) events.push({ t: Math.round(world.time * 100) / 100, type, ...data }); } };
  const start = {
    year: y, t: world.time, width: world.width, height: world.height, nests,
    objects: world.objects.map(thing),
    points: world.points.map((p) => ({ id: p.id, what: p.type, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 })),
    living: colony.ants.filter((f) => f.alive).map(who),
  };
  const born = new Set(colony.ants.map((f) => f.id));
  const tally = { births: 0, deaths: {}, buds: 0, grown: 0 };
  const steps = Math.round(YEAR / DT);
  const every = Math.round(SAMPLE / DT);
  const t0 = Date.now();
  for (let s = 1; s <= steps; s++) {
    withRng(worldDraw, () => stepWorld(world, DT));
    withRng(antDraw, () => updateColony(world, colony, DT));
    for (const f of colony.ants) {
      if (!born.has(f.id)) { born.add(f.id); tally.births += 1; events.push({ t: Math.round(world.time * 100) / 100, type: 'born', ...who(f) }); }
      if (!f.alive && !f.recordedDeath) {
        f.recordedDeath = true;
        tally.deaths[f.cause || 'unknown'] = (tally.deaths[f.cause || 'unknown'] ?? 0) + 1;
        events.push({ t: Math.round(world.time * 100) / 100, type: 'death', id: f.id, cause: f.cause || 'unknown', age: Math.round(f.age ?? 0), x: Math.round(f.x), y: Math.round(f.y) });
      }
    }
    if (s % every === 0) {
      const living = colony.ants.filter((f) => f.alive);
      const buf = Buffer.alloc(12 + living.length * 12);
      buf.writeDoubleLE(world.time, 0);
      buf.writeUInt32LE(living.length, 8);
      living.forEach((f, i) => {
        const o = 12 + i * 12;
        buf.writeUInt32LE(f.id, o);
        buf.writeUInt16LE(Math.max(0, Math.min(65535, Math.round(f.x))), o + 4);
        buf.writeUInt16LE(Math.max(0, Math.min(65535, Math.round(f.y))), o + 6);
        buf.writeUInt8(Math.round(((((f.angle ?? 0) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * 256) & 255, o + 8);
        buf.writeUInt8(actionCode(f.thought?.action), o + 9);
        const home = nestOf(world, f);
        const inNest = home && Math.hypot(home.x - f.x, home.y - f.y) <= radiusOf(home);
        buf.writeUInt8((f.lifeStage === 'juvenile' ? 1 : 0) | (f.carrying ? 2 : 0) | (inNest ? 4 : 0) | (f.sex === 'male' ? 8 : 0), o + 10);
        buf.writeUInt8(nestIndex(homeOf(f)), o + 11);
      });
      frames.push(buf);
      frameBytes += buf.length;
    }
    if (s % Math.round(YEAR / 4 / DT) === 0) {
      const alive = colony.ants.filter((f) => f.alive).length;
      console.log(`year ${(world.time / YEAR).toFixed(2)}  alive ${alive}  nests ${nestsOf(world).length}  map ${world.width}x${world.height}  trees ${world.objects.filter((o) => o.type === 'tree').length}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
  }
  world.rec = null;
  tally.buds = events.filter((e) => e.type === 'colony_found' && e.bud).length;
  tally.grown = events.filter((e) => e.type === 'map_grow').length;
  const summary = {
    year: y, t: world.time, alive: colony.ants.filter((f) => f.alive).length, nests: nestsOf(world).length,
    width: world.width, height: world.height,
    trees: world.objects.filter((o) => o.type === 'tree').length, water: world.objects.filter((o) => o.type === 'water').length,
    ...tally, events: events.length, frames: frames.length, frameBytes, seconds: Math.round((Date.now() - t0) / 1000),
    nestIds: nests, actions: [...state.actions],
  };
  writeAtomic(join(YEARS_DIR, `${pad(y)}.start.json.gz`), gzipSync(JSON.stringify(start)));
  writeAtomic(join(YEARS_DIR, `${pad(y)}.events.jsonl.gz`), gzipSync(events.map((e) => JSON.stringify(e)).join('\n')));
  writeAtomic(join(YEARS_DIR, `${pad(y)}.frames.bin.gz`), gzipSync(Buffer.concat(frames)));
  writeAtomic(join(YEARS_DIR, `${pad(y)}.json`), JSON.stringify(summary));
  return summary;
}

// The night mind holds a function: drop it, she makes a new one when she
// next sleeps (sleep.js).
function save() {
  for (const f of colony.ants) delete f.nightMind;
  writeAtomic(CHECKPOINT, gzipSync(v8.serialize(state)));
}

while (state.year < YEARS) {
  const y = state.year + 1;
  const s = runYear(y);
  state.year = y;
  save();
  console.log(`== year ${y}: alive ${s.alive}, nests ${s.nests}, map ${s.width}x${s.height}, births ${s.births}, deaths ${Object.values(s.deaths).reduce((a, b) => a + b, 0)}, ${s.seconds} s`);
  if (!colony.ants.some((f) => f.alive)) { console.log('extinct'); break; }
}
