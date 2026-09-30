// Revision 1's first check: the bite point with the 'current' judge is the
// same Fagi as without it. Reruns the connected episodes of step 1b with
// DECIDE.eat = 'current' and compares fingerprints with the stored parts.
//
//   node research/adaptive-decision/verify-current.js [--out research/results/adaptive-decision]

import { readFileSync, existsSync } from 'node:fs';
import { enableOrganism } from '../../src/organism.js';
import { set, runEpisode } from './episode.js';
import { PROFILES, EPISODES, SEED, mapSeed } from './design.js';

const argv = process.argv.slice(2);
const OUT = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : 'research/results/adaptive-decision';

enableOrganism();
set({ ...PROFILES.connected, 'DECIDE.eat': 'current' });
let differ = 0;
let compared = 0;
for (let i = 0; i < EPISODES; i++) {
  const file = `${OUT}/parts/connected-${i}.json`;
  if (!existsSync(file)) continue;
  const before = JSON.parse(readFileSync(file, 'utf8')).fingerprint;
  const now = runEpisode({ seed: SEED + i, mapSeed: mapSeed(i) }).fingerprint;
  compared += 1;
  if (now !== before) { differ += 1; console.log(`connected ${i}: ${before} -> ${now}`); }
}
console.log(`DECIDE.eat 'current': ${compared - differ}/${compared} episodes identical to the bite point off`);
if (differ) process.exitCode = 1;
