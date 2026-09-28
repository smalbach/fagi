// Runs the follow-up evaluation of the organism (docs/research/organism2-protocol.md),
// resumable like research/organism/run.js: every piece is its own process and file.
//
//   node research/organism2/run.js [--jobs 16] [--out research/results/organism2] [--lives N] [--offset K]
//
// A piece alone: node research/organism2/run.js --piece <condition> <env> <from> <to> <file> [offset]

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import * as CONFIG from '../../src/config.js';
import { enableOrganism } from '../../src/organism.js';
import { runLife } from '../organism/life.js';
import { INDIVIDUAL, ENVIRONMENTS, LIFE_SECONDS, SHIFT_AT, SPECIES, LIVES, LIFE_SEED, mapSeed } from './design.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);

if (argv[0] === '--piece') {
  const [, condition, env, from, to, file, offset = '0'] = argv;
  const k = Number(offset);
  enableOrganism();
  CONFIG.MAPGEN.species = SPECIES;
  for (const [path, value] of Object.entries(INDIVIDUAL[condition])) {
    const [block, key] = path.split('.');
    CONFIG[block][key] = value;
  }
  const rows = [];
  for (let i = Number(from); i < Number(to); i++) {
    rows.push({ i, ...runLife({ fagiSeed: LIFE_SEED + k + i, mapSeed: mapSeed(k + i), seconds: LIFE_SECONDS, shiftAt: env === 'shift' ? SHIFT_AT : null }) });
  }
  writeFileSync(file, JSON.stringify(rows));
  process.exit(0);
}

const run = promisify(execFile);
const JOBS = Number(opt('--jobs', 16));
const OUT = opt('--out', 'research/results/organism2');
const N = Number(opt('--lives', LIVES));
const OFFSET = opt('--offset', '0');
const CHUNK = 10;
const self = fileURLToPath(import.meta.url);
const part = (c, env, from) => `${OUT}/parts/individual/${c}-${env}-${from}.json`;

mkdirSync(`${OUT}/parts/individual`, { recursive: true });
const todo = [];
for (let from = 0; from < N; from += CHUNK) {
  for (const env of ENVIRONMENTS) for (const c of Object.keys(INDIVIDUAL)) {
    if (!existsSync(part(c, env, from))) todo.push([c, env, from, Math.min(N, from + CHUNK)]);
  }
}
let done = 0;
const total = todo.length;
async function worker() {
  while (todo.length) {
    const [c, env, from, to] = todo.shift();
    const file = part(c, env, from);
    await run('node', [self, '--piece', c, env, String(from), String(to), `${file}.tmp`, OFFSET], { maxBuffer: 1 << 26 });
    renameSync(`${file}.tmp`, file);
    done += 1;
    console.log(`${new Date().toISOString()} ${c} ${env} ${from}-${to} (${done}/${total})`);
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));
console.log(`done: ${total} pieces`);
