// Step 1b's first gate: with the decision point off, every episode is the
// one step 1 measured. Reruns them in this process and compares fingerprints
// with the stored parts (written before DECIDE existed).
//
//   node research/adaptive-decision/verify-off.js [--out research/results/adaptive-decision]

import { readFileSync, existsSync } from 'node:fs';
import { enableOrganism } from '../../src/organism.js';
import { DECIDE } from '../../src/config.js';
import { set, runEpisode } from './episode.js';
import { PROFILES, EPISODES, SEED, mapSeed } from './design.js';

const argv = process.argv.slice(2);
const OUT = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : 'research/results/adaptive-decision';

enableOrganism();
let differ = 0;
let compared = 0;
for (const p of ['game', 'experimental']) {
  set(PROFILES[p]);
  DECIDE.enabled = 0;
  for (let i = 0; i < EPISODES; i++) {
    const file = `${OUT}/parts/${p}-${i}.json`;
    if (!existsSync(file)) continue;
    const before = JSON.parse(readFileSync(file, 'utf8')).fingerprint;
    const now = runEpisode({ seed: SEED + i, mapSeed: mapSeed(i) }).fingerprint;
    compared += 1;
    if (now !== before) { differ += 1; console.log(`${p} ${i}: ${before} -> ${now}`); }
  }
}
console.log(`DECIDE off: ${compared - differ}/${compared} episodes identical to step 1`);
if (differ) process.exitCode = 1;
