// Runs the evaluation of phase 9 (docs/research/forage-protocol.md),
// resumable: every colony is its own process and file.
//
//   node research/forage/run.js [--jobs 16] [--out research/results/forage] [--colonies N] [--populations N] [--offset K] [--only colonies|populations]
//
// One alone: node research/forage/run.js --piece <condition> <i> <file> [offset]
// --offset shifts every seed: for piloting without touching the confirmatory
// seeds (the protocol's run uses no offset).

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { enableOrganism } from '../../src/organism.js';
import { runColony, set } from './colony.js';
import { runPopulation } from './population.js';
import {
  BASE, CONDITIONS, COLONIES, SEED, mapSeed, POP_CONDITIONS, POPULATIONS, POP_SEED, popMapSeed, POP_SECONDS,
} from './design.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);

if (argv[0] === '--piece') {
  const [, condition, i, file, offset = '0'] = argv;
  const k = Number(offset) + Number(i);
  enableOrganism();
  set(BASE);
  const pop = POP_CONDITIONS[condition];
  set(pop ?? CONDITIONS[condition]);
  const row = pop
    ? { i: Number(i), ...runPopulation({ seed: POP_SEED + k, mapSeed: popMapSeed(k), seconds: POP_SECONDS }) }
    : { i: Number(i), ...runColony({ seed: SEED + k, mapSeed: mapSeed(k), shift: Boolean(CONDITIONS[condition].shift) }) };
  writeFileSync(file, JSON.stringify([row]));
  process.exit(0);
}

const run = promisify(execFile);
const JOBS = Number(opt('--jobs', 16));
const OUT = opt('--out', 'research/results/forage');
const N = Number(opt('--colonies', COLONIES));
const NP = Number(opt('--populations', POPULATIONS));
const ONLY = opt('--only', null);
const OFFSET = opt('--offset', '0');
const self = fileURLToPath(import.meta.url);
const part = (c, i) => `${OUT}/parts/${c}-${i}.json`;

mkdirSync(`${OUT}/parts`, { recursive: true });
const todo = [];
// Populations first: they are the long ones.
if (ONLY !== 'colonies') for (let i = 0; i < NP; i++) for (const c of Object.keys(POP_CONDITIONS)) if (!existsSync(part(c, i))) todo.push([c, i]);
if (ONLY !== 'populations') for (let i = 0; i < N; i++) for (const c of Object.keys(CONDITIONS)) if (!existsSync(part(c, i))) todo.push([c, i]);
let done = 0;
const total = todo.length;
async function worker() {
  while (todo.length) {
    const [c, i] = todo.shift();
    const file = part(c, i);
    await run('node', [self, '--piece', c, String(i), `${file}.tmp`, OFFSET], { maxBuffer: 1 << 26 });
    renameSync(`${file}.tmp`, file);
    done += 1;
    console.log(`${new Date().toISOString()} ${c} ${i} (${done}/${total})`);
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));
console.log(`done: ${total} pieces`);
