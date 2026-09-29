// Runs the evaluation of social learning with a misinformed sister
// (docs/research/social-protocol.md), resumable like research/organism2/run.js:
// every piece is its own process and file.
//
//   node research/social/run.js [--jobs 16] [--out research/results/social] [--colonies N] [--offset K]
//
// A piece alone: node research/social/run.js --piece <informant> <from> <to> <file> [offset]

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import * as CONFIG from '../../src/config.js';
import { enableOrganism } from '../../src/organism.js';
import { runColony } from './colony.js';
import { INFORMANTS, SIZE, DEV_SECONDS, SECONDS, SPECIES, COLONIES, SEED, mapSeed } from './design.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);

if (argv[0] === '--piece') {
  const [, informant, from, to, file, offset = '0'] = argv;
  const k = Number(offset);
  // The whole organism as it is when this protocol was frozen, but no breeding:
  // the colony stays the sisters it started with.
  enableOrganism();
  CONFIG.LIFE.enabled = 0;
  CONFIG.MAPGEN.species = SPECIES;
  const rows = [];
  for (let i = Number(from); i < Number(to); i++) {
    rows.push({ i, ...runColony({ seed: SEED + k + i, mapSeed: mapSeed(k + i), informant, size: SIZE, devSeconds: DEV_SECONDS, seconds: SECONDS }) });
  }
  writeFileSync(file, JSON.stringify(rows));
  process.exit(0);
}

const run = promisify(execFile);
const JOBS = Number(opt('--jobs', 16));
const OUT = opt('--out', 'research/results/social');
const N = Number(opt('--colonies', COLONIES));
const OFFSET = opt('--offset', '0');
const CHUNK = 5;
const self = fileURLToPath(import.meta.url);
const part = (c, from) => `${OUT}/parts/${c}-${from}.json`;

mkdirSync(`${OUT}/parts`, { recursive: true });
const todo = [];
for (let from = 0; from < N; from += CHUNK) {
  for (const c of INFORMANTS) if (!existsSync(part(c, from))) todo.push([c, from, Math.min(N, from + CHUNK)]);
}
let done = 0;
const total = todo.length;
async function worker() {
  while (todo.length) {
    const [c, from, to] = todo.shift();
    const file = part(c, from);
    await run('node', [self, '--piece', c, String(from), String(to), `${file}.tmp`, OFFSET], { maxBuffer: 1 << 26 });
    renameSync(`${file}.tmp`, file);
    done += 1;
    console.log(`${new Date().toISOString()} ${c} ${from}-${to} (${done}/${total})`);
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));
console.log(`done: ${total} pieces`);
