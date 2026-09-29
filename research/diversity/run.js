// Runs the evaluation of adaptation and diversity (docs/research/diversity-protocol.md),
// resumable: every population is its own process and file.
//
//   node research/diversity/run.js [--jobs 16] [--out research/results/diversity] [--populations N] [--offset K]
//
// One alone: node research/diversity/run.js --piece <condition> <i> <file> [offset]

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import * as CONFIG from '../../src/config.js';
import { enableOrganism } from '../../src/organism.js';
import { runShiftPopulation } from './population.js';
import { CONDITIONS, SECONDS, SHIFT_AT, SPECIES, POPULATIONS, SEED, mapSeed } from './design.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);

if (argv[0] === '--piece') {
  const [, condition, i, file, offset = '0'] = argv;
  const k = Number(offset) + Number(i);
  // The whole organism as it is when this protocol was frozen, breeding included.
  enableOrganism();
  CONFIG.MAPGEN.species = SPECIES;
  for (const [path, value] of Object.entries(CONDITIONS[condition].set)) {
    const [block, key] = path.split('.');
    CONFIG[block][key] = value;
  }
  const row = { i: Number(i), ...runShiftPopulation({ seed: SEED + k, mapSeed: mapSeed(k), seconds: SECONDS, shiftAt: SHIFT_AT, invert: CONDITIONS[condition].invert }) };
  writeFileSync(file, JSON.stringify([row]));
  process.exit(0);
}

const run = promisify(execFile);
const JOBS = Number(opt('--jobs', 16));
const OUT = opt('--out', 'research/results/diversity');
const N = Number(opt('--populations', POPULATIONS));
const OFFSET = opt('--offset', '0');
const self = fileURLToPath(import.meta.url);
const part = (c, i) => `${OUT}/parts/${c}-${i}.json`;

mkdirSync(`${OUT}/parts`, { recursive: true });
const todo = [];
for (let i = 0; i < N; i++) for (const c of Object.keys(CONDITIONS)) if (!existsSync(part(c, i))) todo.push([c, i]);
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
