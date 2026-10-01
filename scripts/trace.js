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
// The fingerprint rests on this Node's floating point. If a new Node ever
// changes it, every scenario differs at once, from early on: record the
// fixture again only after making sure the change is not in her.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
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
const FIXTURE = fileURLToPath(new URL('../test/fixtures/decisions.json', import.meta.url));
const DT = 0.05;      // batch's step
const EVERY = 60;     // seconds between checkpoints

// The game's organism (src/app/organism-on.js) on a map of wild species.
async function game() {
  await import('../src/app/organism-on.js');
  CONFIG.MAPGEN.species = 6;
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
    const fixture = {
      _: 'Fingerprints of how she decides (scripts/trace.js), recorded from the fixed hierarchy of '
        + 'src/decision.js before src/program.js existed. test/program.test.js holds every change against them.',
      node: process.version,
      scenarios,
    };
    writeFileSync(FIXTURE, `${JSON.stringify(fixture, null, 1)}\n`);
    console.error(`written ${FIXTURE}`);
  } else if (SCENARIOS[arg]) {
    await SCENARIOS[arg].setup?.();
    applySets(process.argv.slice(3));
    process.stdout.write(JSON.stringify(trace(SCENARIOS[arg])));
  } else {
    console.error(`usage: node scripts/trace.js <${Object.keys(SCENARIOS).join('|')}> | --write`);
    process.exit(1);
  }
}
