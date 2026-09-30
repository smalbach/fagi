// Integrating caution in the game (docs/research/caution-protocol.md): one
// Fagi as the game plays her, with or without her two born lines of
// caution, on the classic map or with wild species. Resumable.
//
//   node research/adaptive-decision/game-caution.js --group gdev|gconf [--worlds 40] [--jobs 16]
//
// One alone: node research/adaptive-decision/game-caution.js --piece <profile> <arm> <group> <i> <file>

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { enableOrganism } from '../../src/organism.js';
import { set, runEpisode } from './episode.js';
import { GAME_PROFILES, CAUTION, GAME_GROUPS, HORIZON } from './design.js';

export const ARMS = { current: {}, caution: CAUTION };
const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);

if (argv[0] === '--piece') {
  const [, profile, arm, group, i, file] = argv;
  enableOrganism();
  set(GAME_PROFILES[profile]);
  set(ARMS[arm]);
  const g = GAME_GROUPS[group];
  const t0 = process.hrtime.bigint();
  const r = runEpisode({ seed: g.seed + Number(i), mapSeed: g.map(Number(i)), horizon: HORIZON });
  const ms = Math.round(Number(process.hrtime.bigint() - t0) / 1e6);
  writeFileSync(file, JSON.stringify({ profile, arm, group, i: Number(i), ms, ...r }));
  process.exit(0);
}

const run = promisify(execFile);
const GROUP = opt('--group', 'gdev');
const N = Number(opt('--worlds', 40));
const JOBS = Number(opt('--jobs', 16));
const OUT = `research/results/adaptive-decision/caution/${GROUP}`;
const self = fileURLToPath(import.meta.url);
mkdirSync(OUT, { recursive: true });
const todo = [];
for (let i = 0; i < N; i++) for (const p of Object.keys(GAME_PROFILES)) for (const a of Object.keys(ARMS)) {
  const file = `${OUT}/${p}-${a}-${i}.json`;
  if (!existsSync(file)) todo.push([p, a, i, file]);
}
let done = 0;
await Promise.all(Array.from({ length: JOBS }, async () => {
  while (todo.length) {
    const [p, a, i, file] = todo.shift();
    await run('node', [self, '--piece', p, a, GROUP, String(i), `${file}.tmp`], { maxBuffer: 1 << 26 });
    renameSync(`${file}.tmp`, file);
    done += 1;
    if (done % 40 === 0) console.log(`${GROUP}: ${done}`);
  }
}));
console.log(`${GROUP}: done`);
