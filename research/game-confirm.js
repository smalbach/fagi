// The preregistered game confirmation (docs/research/preregistration.md, "Game
// confirmation"), run so that it survives interruptions: every lineage is its
// own `scripts/batch.js --runs 1 --seed 5000+i` process and its own file, and a
// rerun skips the lineages already done. A lineage depends only on its seed, so
// this is the preregistered command cut into pieces. When all 75 of a format
// are done they are merged into F.json for research/embodied.js.
//
//   node research/game-confirm.js [--jobs 4] [--out research/results/game-confirm]

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';

const run = promisify(execFile);
const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);
const JOBS = Number(opt('--jobs', 4));
const OUT = opt('--out', 'research/results/game-confirm');
const RUNS = 75;
const SEED = 5000;

const COMMON = ['--generations', '8', '--switch-at', '4', '--colony', '4', '--duration', '1800',
  '--set', 'MAPGEN.species=6', '--set', 'GEN.genes=0', '--set', 'SOCIAL.budget=4',
  '--set', 'GEN.budget=4', '--set', 'SOCIAL.topic=food'];
const FORMATS = {
  none: ['--set', 'GEN.culture=0', '--set', 'SOCIAL.share=0'],
  verdict: ['--set', 'SOCIAL.format=verdict'],
  rule: ['--set', 'SOCIAL.format=rule'],
  evidence: ['--set', 'SOCIAL.format=evidence'],
};

const part = (f, seed) => `${OUT}/parts/${f}/${seed}.json`;

// Lineage by lineage across formats, so a partial run is still paired.
const todo = [];
for (let i = 0; i < RUNS; i++) {
  for (const f of Object.keys(FORMATS)) {
    mkdirSync(`${OUT}/parts/${f}`, { recursive: true });
    if (!existsSync(part(f, SEED + i))) todo.push({ f, seed: SEED + i });
  }
}

let done = 0;
const total = todo.length;
async function worker() {
  while (todo.length) {
    const { f, seed } = todo.shift();
    const tmp = `${part(f, seed)}.tmp`;
    await run('node', ['scripts/batch.js', ...COMMON, ...FORMATS[f], '--runs', '1', '--seed', String(seed), '--json', tmp],
      { maxBuffer: 1 << 26 });
    // Renamed only when complete, so an interrupted lineage is simply redone.
    renameSync(tmp, part(f, seed));
    done += 1;
    console.log(`${new Date().toISOString()} ${f} ${seed} (${done}/${total})`);
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));

for (const f of Object.keys(FORMATS)) {
  const seeds = Array.from({ length: RUNS }, (_, i) => SEED + i);
  if (!seeds.every((s) => existsSync(part(f, s)))) continue;
  const pieces = seeds.map((s) => JSON.parse(readFileSync(part(f, s), 'utf8')));
  const opts = { ...pieces[0].opts, runs: RUNS, seed0: SEED };
  writeFileSync(`${OUT}/${f}.json`, JSON.stringify({ opts, lineages: pieces.flatMap((p) => p.lineages) }));
}
console.log('done');
