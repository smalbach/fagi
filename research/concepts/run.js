// Runs the concepts evaluation (docs/research/concepts-protocol.md), resumable
// like research/organism/run.js: every piece is its own process and file.
//
//   node research/concepts/run.js [--jobs 16] [--out research/results/concepts] [--lives N] [--offset K]
//
// A piece alone: node research/concepts/run.js --piece <condition> <family> <world> <from> <to> <file> [offset]

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import * as CONFIG from '../../src/config.js';
import { enableOrganism } from '../../src/organism.js';
import { runThingLife } from '../../scripts/concept-lab.js';
import { CONDITIONS, FAMILIES, WORLDS, SECONDS, SPECIES, LIVES, LIFE_SEED, mapSeed } from './design.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);

if (argv[0] === '--piece') {
  const [, condition, family, world, from, to, file, offset = '0'] = argv;
  const k = Number(offset);
  enableOrganism();
  CONFIG.THERMAL.voluntary = 0;   // came after this protocol was frozen
  CONFIG.MAPGEN.species = SPECIES;
  CONFIG.CONCEPT.dims = FAMILIES[family];
  for (const [path, value] of Object.entries(CONDITIONS[condition])) {
    const [block, key] = path.split('.');
    CONFIG[block][key] = value;
  }
  const rows = [];
  for (let i = Number(from); i < Number(to); i++) {
    rows.push({ i, ...runThingLife({ fagiSeed: LIFE_SEED + k + i, mapSeed: mapSeed(k + i), seconds: SECONDS, turn: world === 'turn' }) });
  }
  writeFileSync(file, JSON.stringify(rows));
  process.exit(0);
}

const run = promisify(execFile);
const JOBS = Number(opt('--jobs', 16));
const OUT = opt('--out', 'research/results/concepts');
const N = Number(opt('--lives', LIVES));
const OFFSET = opt('--offset', '0');
const CHUNK = 10;
const self = fileURLToPath(import.meta.url);
const part = (c, f, w, from) => `${OUT}/parts/${c}-${f}-${w}-${from}.json`;

mkdirSync(`${OUT}/parts`, { recursive: true });
const todo = [];
for (let from = 0; from < N; from += CHUNK) {
  for (const w of WORLDS) for (const f of Object.keys(FAMILIES)) for (const c of Object.keys(CONDITIONS)) {
    if (!existsSync(part(c, f, w, from))) todo.push([c, f, w, from, Math.min(N, from + CHUNK)]);
  }
}
let done = 0;
const total = todo.length;
async function worker() {
  while (todo.length) {
    const [c, f, w, from, to] = todo.shift();
    const file = part(c, f, w, from);
    await run('node', [self, '--piece', c, f, w, String(from), String(to), `${file}.tmp`, OFFSET], { maxBuffer: 1 << 26 });
    renameSync(`${file}.tmp`, file);
    done += 1;
    console.log(`${new Date().toISOString()} ${c} ${f} ${w} ${from}-${to} (${done}/${total})`);
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));
console.log(`done: ${total} pieces`);
