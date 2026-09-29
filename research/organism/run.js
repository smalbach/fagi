// Runs the organism evaluation (docs/research/organism-protocol.md) so that it
// survives interruptions: every piece (one condition, one world, a chunk of
// seeds) is its own process and its own file, and a rerun skips the pieces
// already done. A piece depends only on its seeds, so the pieces are the whole
// run cut up.
//
//   node research/organism/run.js [--jobs 12] [--out research/results/organism]
//                                  [--only individual|population] [--lives N] [--populations N]
//                                  [--offset K]
//
// --offset shifts every seed by K: for trying the harness without touching the
// confirmatory seeds (the protocol's run uses no offset).
//
// A piece alone: node research/organism/run.js --piece <kind> <condition> <env> <from> <to> <file>

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import * as CONFIG from '../../src/config.js';
import { enableOrganism } from '../../src/organism.js';
import {
  INDIVIDUAL, ENVIRONMENTS, POPULATION, LIFE_SECONDS, SHIFT_AT, POPULATION_SECONDS, SPECIES,
  LIVES, LIFE_SEED, mapSeed, POPULATIONS, POPULATION_SEED,
} from './design.js';
import { runLife } from './life.js';
import { runPopulation } from './population.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);

function configure(settings) {
  enableOrganism();
  // Things and concepts came after this protocol was frozen: the organism it
  // evaluated had none (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §12.8).
  CONFIG.CONCEPT.enabled = 0;
  CONFIG.THERMAL.voluntary = 0;   // and the thermal reflex went off only with harm done
  CONFIG.LIFE.gradual = 0;        // and only adults bred, braked only by the nest's ceiling
  CONFIG.SLEEP.askAlways = 0;     // and the night asked only after a day with bites
  CONFIG.SLEEP.replay = 4;        // and rehearsed the remembered fruit four rounds
  CONFIG.HEALTH.enabled = 0;      // and health did not exist
  CONFIG.TASTE.enabled = 0;       // nor tastes
  CONFIG.SOURCES.enabled = 0;     // and trees were food sources from birth
  CONFIG.MAPGEN.species = SPECIES;
  for (const [path, value] of Object.entries(settings)) {
    const [block, key] = path.split('.');
    CONFIG[block][key] = value;
  }
}

// --- one piece, in this process ------------------------------------------

if (argv[0] === '--piece') {
  const [, kind, condition, env, from, to, file, offset = '0'] = argv;
  const k = Number(offset);
  const rows = [];
  if (kind === 'individual') {
    configure(INDIVIDUAL[condition]);
    for (let i = Number(from); i < Number(to); i++) {
      rows.push({ i, ...runLife({ fagiSeed: LIFE_SEED + k + i, mapSeed: mapSeed(k + i), seconds: LIFE_SECONDS, shiftAt: env === 'shift' ? SHIFT_AT : null }) });
    }
  } else {
    configure(POPULATION[condition]);
    for (let i = Number(from); i < Number(to); i++) {
      rows.push({ i, ...runPopulation({ seed: POPULATION_SEED + k + i, mapSeed: mapSeed(1000 + k + i), seconds: POPULATION_SECONDS }) });
    }
  }
  writeFileSync(file, JSON.stringify(rows));
  process.exit(0);
}

// --- the driver -------------------------------------------------------------

const run = promisify(execFile);
const JOBS = Number(opt('--jobs', 12));
const OUT = opt('--out', 'research/results/organism');
const ONLY = opt('--only', null);
const N_LIVES = Number(opt('--lives', LIVES));
const N_POPS = Number(opt('--populations', POPULATIONS));
const OFFSET = opt('--offset', '0');
const CHUNK = 10;
const self = fileURLToPath(import.meta.url);

const todo = [];
const part = (kind, c, env, from) => `${OUT}/parts/${kind}/${c}-${env}-${from}.json`;
if (ONLY !== 'population') {
  mkdirSync(`${OUT}/parts/individual`, { recursive: true });
  for (let from = 0; from < N_LIVES; from += CHUNK) {
    for (const env of ENVIRONMENTS) {
      for (const c of Object.keys(INDIVIDUAL)) {
        const to = Math.min(N_LIVES, from + CHUNK);
        if (!existsSync(part('individual', c, env, from))) todo.push(['individual', c, env, from, to]);
      }
    }
  }
}
if (ONLY !== 'individual') {
  mkdirSync(`${OUT}/parts/population`, { recursive: true });
  for (let from = 0; from < N_POPS; from += 1) {
    for (const c of Object.keys(POPULATION)) {
      if (!existsSync(part('population', c, 'stable', from))) todo.push(['population', c, 'stable', from, from + 1]);
    }
  }
}

let done = 0;
const total = todo.length;
async function worker() {
  while (todo.length) {
    const [kind, c, env, from, to] = todo.shift();
    const file = part(kind, c, env, from);
    await run('node', [self, '--piece', kind, c, env, String(from), String(to), `${file}.tmp`, OFFSET], { maxBuffer: 1 << 26 });
    // Renamed only when complete, so an interrupted piece is simply redone.
    renameSync(`${file}.tmp`, file);
    done += 1;
    console.log(`${new Date().toISOString()} ${kind} ${c} ${env} ${from}-${to} (${done}/${total})`);
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));
console.log(`done: ${total} pieces`);
