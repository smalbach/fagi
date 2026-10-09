// The fingerprint of how she decides: seeded lives, run frame by frame and
// reduced to one hash each, plus a few checkpoints to read when two differ.
//
// Same seeds and same code, same fingerprint (the three streams of batch:
// map, world, Fagi). test/program.test.js holds today's against the ones in
// test/fixtures/decisions.json, recorded from the hierarchy as it was written
// in decision.js before her program existed (src/program.js): a program
// nobody edited must decide exactly as that hierarchy did, to the last frame.
//
//   node scripts/trace.js <scenario> [--set BLOCK.key=V ...]
//                                      one scenario, as JSON on stdout
//   node scripts/trace.js --write      every scenario, each in a process of
//                                      its own, into the fixture
//
// A process per scenario: config.js is shared state, and a scenario that
// turns the organism on must not leave it on for the next one.
//
// The fingerprint rests on the machine's floating point, to the last bit:
// Math.sin, exp... are V8's own, but compiled differently per processor (on
// ARM64 a multiply and an add fuse into one rounding), and a new Node can
// move them too. The same code then draws a different last bit, and a colony
// of eleven amplifies it into another life within a minute. So the fixture
// keeps one set per machine and Node (`platforms`, keyed by recordingKey()),
// and a test reads its own. --write records the set of the machine it runs
// on, leaving the others: run it from a commit you trust, never to make a
// change pass.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as CONFIG from '../src/config.js';
import { enableOrganism } from '../src/organism.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { stepWorld } from '../src/simulation.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { createColony, updateColony } from '../src/colony.js';
import { rng, withRng } from './batch/random.js';

const HERE = fileURLToPath(import.meta.url);

// Which recording this machine reads: platform, processor and Node's major.
export const recordingKey = () => `${process.platform}-${process.arch}-node${process.versions.node.split('.')[0]}`;

// This machine's fingerprints: its own set, or the first one ever recorded
// (`legacy`, on the author's machine, Node 24) if it has none and runs the
// same Node major; null when there is nothing it can be held to.
export function fingerprintsFor(fixture) {
  const own = fixture.platforms?.[recordingKey()];
  if (own) return { ...own, key: recordingKey() };
  const old = fixture.legacy;
  if (old && old.node.split('.')[0] === `v${process.versions.node.split('.')[0]}`) return { ...old, key: 'legacy' };
  return null;
}
const FIXTURE = fileURLToPath(new URL('../test/fixtures/decisions.json', import.meta.url));
const DT = 0.05;      // batch's step
const EVERY = 60;     // seconds between checkpoints

// The game's organism (src/app/organism-on.js) on a map of wild species.
async function game() {
  await import('../src/app/organism-on.js');
  CONFIG.MAPGEN.species = 6;
  // Her gait (gait.js) came after the fixture: it changes her pace, not how
  // she decides, but a slower or faster step moves every frame after it.
  CONFIG.MOVEMENT.enabled = 0;
  // So did individual variation (variation.js): a body of her own changes
  // what she can do, and so every frame, not how she decides.
  CONFIG.VARY.founders = 0;
  CONFIG.VARY.births = 0;
  // The fixture was recorded on the maps drawn before MAPGEN.inside existed:
  // it holds her decisions, not the map, so it keeps those maps.
  CONFIG.MAPGEN.inside = 0;
}

// Long enough for the rarer lines to answer: anticipating rain (classic),
// drawing on the pantry (organism), huddling, cold and dusk (things).
export const SCENARIOS = {
  // The preregistered world: config.js as it is, on the classic map.
  classic: { map: 42, seed: 1001, duration: 2400 },
  // The game: the whole organism, wild species, caution when eating.
  organism: { map: 12, seed: 31, duration: 2400, setup: game },
  // The same, on a map where a fruit poisons her to death.
  poisoned: { map: 7, seed: 2002, duration: 900, setup: game },
  // Things with no inborn category: sipping, huddling, probing, lining the nest.
  things: {
    map: 11, seed: 3003, duration: 2400,
    setup: () => { enableOrganism(); CONFIG.CONCEPT.enabled = 1; CONFIG.MAPGEN.species = 6; },
  },
  // Seasonal trees, food sites and the learned choice at the decision point.
  forage: {
    map: 5, seed: 4004, duration: 900,
    setup: () => { for (const b of ['FORAGE', 'SITES', 'CHOICE', 'DECIDE']) CONFIG[b].enabled = 1; },
  },
  // Three sisters of the game's organism, who may breed.
  colony: { map: 9, seed: 5005, duration: 600, ants: 3, setup: game },
  // The random baseline, which skips the hierarchy altogether.
  random: { map: 42, seed: 6006, duration: 300, setup: () => { CONFIG.BASELINE.policy = 'random'; } },
};

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

function checkpoint(world, ants) {
  const f = ants.find((a) => a.alive) ?? ants[0];
  return {
    t: r1(world.time),
    alive: ants.filter((a) => a.alive).length,
    id: f.id ?? 1,
    x: r2(f.x), y: r2(f.y),
    action: f.thought?.action ?? null, rule: f.thought?.rule ?? null,
    hunger: r1(f.hunger), thirst: r1(f.thirst), energy: r1(f.energy),
  };
}

// One seeded life (or colony), frame by frame. Every living one adds to the
// hash, every frame, where she is and which line of her hierarchy answered.
export function trace({ map, seed, duration, ants = 0 }) {
  const mapRng = rng(map);
  const worldRng = rng(map + 1);
  const fagiRng = rng(seed);
  const world = withRng(mapRng, () => { const w = createWorld(); generateMap(w); return w; });
  const colony = ants ? withRng(fagiRng, () => createColony(ants)) : null;
  const lone = colony ? null : withRng(fagiRng, () => createFagi());
  const everyone = () => (colony ? colony.ants : [lone]);

  const hash = createHash('sha256');
  const rules = {};
  const checkpoints = [];
  const steps = Math.ceil(duration / DT);
  const every = Math.round(EVERY / DT);
  let i = 0;
  for (; i < steps && everyone().some((f) => f.alive); i++) {
    withRng(worldRng, () => stepWorld(world, DT));
    withRng(fagiRng, () => (colony ? updateColony(world, colony, DT) : updateFagi(lone, world, DT)));
    for (const f of everyone()) {
      if (!f.alive) continue;
      const th = f.thought;
      hash.update(`${f.id ?? 1} ${f.x} ${f.y} ${th?.action} ${th?.tier} ${th?.rule}\n`);
      const k = `${th?.tier}/${th?.rule}`;
      rules[k] = (rules[k] ?? 0) + 1;
    }
    if ((i + 1) % every === 0) checkpoints.push(checkpoint(world, everyone()));
  }
  const all = everyone();
  return {
    digest: hash.digest('hex').slice(0, 32),
    steps: i,
    end: {
      t: r2(world.time),
      ants: all.length,
      alive: all.filter((f) => f.alive).length,
      causes: all.filter((f) => !f.alive).map((f) => f.cause),
    },
    rules: Object.fromEntries(Object.entries(rules).sort(([a], [b]) => (a < b ? -1 : 1))),
    checkpoints,
  };
}

// A scenario in a process of its own, as the test runs it; `sets` are
// 'BLOCK.key=V' over the scenario's own settings.
export function traceApart(name, sets = []) {
  const args = [HERE, name, ...sets.flatMap((s) => ['--set', s])];
  return JSON.parse(execFileSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 1 << 24 }));
}

function applySets(args) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] !== '--set') continue;
    const [path, value] = args[i + 1].split('=');
    const [block, key] = path.split('.');
    if (!CONFIG[block] || !(key in CONFIG[block])) throw new Error(`no setting ${path}`);
    CONFIG[block][key] = Number.isFinite(Number(value)) ? Number(value) : value;
  }
}

if (process.argv[1] === HERE) {
  const arg = process.argv[2];
  if (arg === '--write') {
    const scenarios = {};
    for (const name of Object.keys(SCENARIOS)) {
      scenarios[name] = traceApart(name);
      console.error(`${name}: ${scenarios[name].steps} steps, ${scenarios[name].digest}`);
    }
    // This machine's set; every other machine's stays as it was.
    let fixture = {};
    try { fixture = JSON.parse(readFileSync(FIXTURE, 'utf8')); } catch { /* the first one */ }
    fixture._ = 'Fingerprints of how she decides (scripts/trace.js), recorded from the fixed hierarchy of '
      + 'src/decision.js before src/program.js existed, one set per machine and Node. '
      + 'test/program.test.js holds every change against them.';
    fixture.platforms = { ...fixture.platforms, [recordingKey()]: { node: process.version, scenarios } };
    writeFileSync(FIXTURE, `${JSON.stringify(fixture, null, 1)}\n`);
    console.error(`written ${recordingKey()} into ${FIXTURE}`);
  } else if (SCENARIOS[arg]) {
    await SCENARIOS[arg].setup?.();
    applySets(process.argv.slice(3));
    process.stdout.write(JSON.stringify(trace(SCENARIOS[arg])));
  } else {
    console.error(`usage: node scripts/trace.js <${Object.keys(SCENARIOS).join('|')}> | --write`);
    process.exit(1);
  }
}
