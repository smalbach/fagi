// Phase 8's bench (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §12.9): with tastes,
// does she learn what to eat, and come to eat what her innate liking refused?
//
// Each life is the whole organism with tastes (TASTE on) on a map of wild
// species. At the end, and along the way:
//   judgment   over the species of the map: would she eat it (rules, aversion,
//              and at the mouth, whether she would swallow it); balanced over the
//              poisonous and the rest. The look no longer decides what a fruit
//              does, so the catalogue of looks has no truth here.
//   dose       poison taken, in whole fruit
//   spits      fruit she spat out; spitsGood, of those, the ones that were not poison
//   acquired   species she disliked by birth (would spit them) but not poison, that
//              she came to eat whole; of those present on the map
//   acquiredNew  of those, first met already swallowed whole: what she learned of
//              the taste, not of the species, let her
//   lifetime, alive, cause
//
//   node scripts/taste-lab.js [--lives 48] [--seed 5000] [--map 3] [--duration 2400] [--set BLOCK.key=V ...]

import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import { enableOrganism } from '../src/organism.js';
import * as CONFIG from '../src/config.js';
import { isHarmful, registerSpecies, speciesKeys } from '../src/chemistry.js';
import { verdict } from '../src/learned/rules.js';
import { aversive } from '../src/appetite.js';
import { cuesOf } from '../src/learned/cues.js';
import { innateLiking, liking } from '../src/taste.js';
import { rng, withRng } from './batch/random.js';

const args = process.argv.slice(2);
const opt = (name, dflt) => (args.includes(`--${name}`) ? Number(args[args.indexOf(`--${name}`) + 1]) : dflt);
enableOrganism();
CONFIG.MAPGEN.species = 6;
for (let i = 0; i < args.length; i++) {
  if (args[i] !== '--set') continue;
  const [path, value] = args[i + 1].split('=');
  const [block, key] = path.split('.');
  CONFIG[block][key] = Number.isFinite(Number(value)) ? Number(value) : value;
}
const LIVES = opt('lives', 48);
const SEED = opt('seed', 5000);
const MAP = opt('map', 3);
const SECONDS = opt('duration', 2400);
const DT = 0.05;

// Would she eat it, now: not ruled out, not averse, and swallowed at the mouth.
function wouldEat(fagi, key) {
  if (verdict(fagi, 'eat', key) === 'avoid' || aversive(fagi, key, cuesOf(key))) return false;
  const knownGood = (fagi.brain.facts[key]?.tries ?? 0) > 0 && (fagi.brain.facts[key]?.value ?? 0) > 0;
  return knownGood || liking(fagi, key) >= CONFIG.TASTE.spitBelow;
}

const rows = [];
for (let i = 0; i < LIVES; i++) {
  const world = withRng(rng(MAP + 13 * i), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng((SEED + i) * 7919);
  const fagiRng = rng(SEED + i);
  const fagi = withRng(fagiRng, () => createFagi());
  const disliked = speciesKeys().filter((k) => !isHarmful(k) && innateLiking(k) < CONFIG.TASTE.spitBelow);
  const whole = new Set();
  const firstWhole = new Set();
  const met = new Set();
  let dose = 0; let spits = 0; let spitsGood = 0; let eaten = 0; let spit = 0;
  for (let s = 0; s < SECONDS / DT && fagi.alive; s++) {
    withRng(worldRng, () => stepWorld(world, DT));
    withRng(fagiRng, () => updateFagi(fagi, world, DT));
    if (fagi.lastSpit && fagi.lastSpit.n !== spit) {
      spit = fagi.lastSpit.n;
      spits += 1;
      if (!isHarmful(fagi.lastSpit.key)) spitsGood += 1;
    }
    if (fagi.eaten === eaten || !fagi.lastMeal) continue;
    eaten = fagi.eaten;
    const key = fagi.lastMeal.type;
    const portion = fagi.lastEpisode?.portion ?? 1;
    if (isHarmful(key)) dose += portion;
    if (portion === 1) { whole.add(key); if (!met.has(key)) firstWhole.add(key); }
    met.add(key);
  }
  const species = speciesKeys();
  let hit = 0; let miss = 0; let fa = 0; let ok = 0;
  for (const k of species) {
    const eats = wouldEat(fagi, k);
    if (isHarmful(k)) { if (eats) miss++; else hit++; } else if (eats) ok++; else fa++;
  }
  rows.push({
    judgment: ((hit + miss ? hit / (hit + miss) : 1) + (ok + fa ? ok / (ok + fa) : 1)) / 2,
    dose, spits, spitsGood,
    disliked: disliked.length,
    acquired: disliked.filter((k) => whole.has(k)).length,
    acquiredNew: disliked.filter((k) => firstWhole.has(k)).length,
    lifetime: Math.min(fagi.age, SECONDS),
    alive: fagi.alive ? 1 : 0,
    cause: fagi.alive ? null : fagi.cause,
  });
  registerSpecies([]);
}
const mean = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
const se = (k) => { const m = mean(k); return Math.sqrt(rows.reduce((a, r) => a + (r[k] - m) ** 2, 0) / (rows.length - 1) / rows.length); };
const sets = args.filter((a, k) => args[k - 1] === '--set').join(' ');
console.log(`${LIVES} lives × ${SECONDS}s, taste ${CONFIG.TASTE.enabled}${sets ? `, ${sets}` : ''}`);
for (const k of ['judgment', 'dose', 'spits', 'spitsGood', 'disliked', 'acquired', 'acquiredNew', 'lifetime', 'alive']) console.log(`  ${k.padEnd(11)} ${mean(k).toFixed(3)} ± ${se(k).toFixed(3)}`);
const causes = {};
for (const r of rows) if (r.cause) causes[r.cause] = (causes[r.cause] ?? 0) + 1;
console.log('  deaths     ', JSON.stringify(causes));
