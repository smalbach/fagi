// Step 1 of the adaptive decision plan (docs/research/plan-decision-adaptativa.md):
// the reference, measured. Resumable: every episode is its own process and file.
//
//   node research/adaptive-decision/run.js [--jobs 8] [--episodes N] [--out research/results/adaptive-decision]
//
// One alone: node research/adaptive-decision/run.js --piece <profile> <i> <file> [--trace]
// Afterwards: node research/adaptive-decision/analyze.js

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { enableOrganism } from '../../src/organism.js';
import { set, runEpisode } from './episode.js';
import { PROFILES, EPISODES, SEED, mapSeed } from './design.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);

if (argv[0] === '--piece') {
  const [, profile, i, file] = argv;
  enableOrganism();
  set(PROFILES[profile]);
  const row = { profile, i: Number(i), ...runEpisode({ seed: SEED + Number(i), mapSeed: mapSeed(Number(i)), trace: argv.includes('--trace') }) };
  writeFileSync(file, JSON.stringify(row));
  process.exit(0);
}

const run = promisify(execFile);
const JOBS = Number(opt('--jobs', 8));
const OUT = opt('--out', 'research/results/adaptive-decision');
const N = Number(opt('--episodes', EPISODES));
const self = fileURLToPath(import.meta.url);
const part = (p, i) => `${OUT}/parts/${p}-${i}.json`;

mkdirSync(`${OUT}/parts`, { recursive: true });
const todo = [];
for (let i = 0; i < N; i++) for (const p of Object.keys(PROFILES)) if (!existsSync(part(p, i))) todo.push([p, i]);
let done = 0;
const total = todo.length;
async function worker() {
  while (todo.length) {
    const [p, i] = todo.shift();
    const file = part(p, i);
    await run('node', [self, '--piece', p, String(i), `${file}.tmp`], { maxBuffer: 1 << 26 });
    renameSync(`${file}.tmp`, file);
    done += 1;
    console.log(`${new Date().toISOString()} ${p} ${i} (${done}/${total})`);
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));

// Repeatability: episode 0 of each profile again, in a fresh process, must
// give the same fingerprint. And a readable trace of one episode.
for (const p of Object.keys(PROFILES)) {
  const again = `${OUT}/check-${p}.json`;
  await run('node', [self, '--piece', p, '0', again]);
}
if (!existsSync(`${OUT}/trace-experimental-0.json`)) {
  await run('node', [self, '--piece', 'experimental', '0', `${OUT}/trace-experimental-0.json`, '--trace'], { maxBuffer: 1 << 26 });
}
console.log(`done: ${total} episodes`);
