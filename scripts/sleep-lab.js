// Does a night of sleep help her guess fruit she has never tasted?
// (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §25.2, the interleaved replay)
//
// A controlled bench, no map: a random chemistry, K of its species tasted twice
// each (the real eating and feeling path, feeding.js + episodes.js), and then
// the same Fagi twice: once awake, once after one night sorted with the replay
// on. Both are scored on every species of the catalogue she never tasted,
// paired trial by trial.
//
//   accuracy : she calls it right (predicted value below -0.1 = "poison")
//   wary     : how wary the traits make her (learned/cues.js wariness), of
//              the poison ones and of the rest
//
//   node scripts/sleep-lab.js [--k 6] [--trials 300] [--seed 5000]
//                             [--set SLEEP.downscale=0] [--set SLEEP.replay=8]
//
// --game N: the same question in the game instead, N lives of --duration
// seconds with the organism on and MAPGEN.species wild species (6 unless
// --set), one map per life. Reported as is, with whatever --set says
// (--set SLEEP.consolidate=0 is the ablation): how many are alive at the
// end, harmful bites, first bites of a harmful species, and the balanced
// accuracy of her rules over the whole catalogue (research/lab/truth.js).

import { createFagi } from '../src/fagi.js';
import { eat } from '../src/feeding.js';
import { resolveEpisodes } from '../src/episodes.js';
import { consolidate } from '../src/consolidation.js';
import * as CONFIG from '../src/config.js';
import { TRAITS, createChemistry, createSpecies, registerSpecies, feedOf, speciesKey, cuesOfTraits } from '../src/chemistry.js';
import { predict, wariness } from '../src/learned/cues.js';
import { rng, withRng } from './batch/random.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import { enableOrganism } from '../src/organism.js';
import { isHarmful } from '../src/chemistry.js';
import { accuracy } from '../research/lab/truth.js';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const GAME = opt('game', 0);
// The game needs the organism on before --set, so a --set can turn a part off.
if (GAME) { enableOrganism(); CONFIG.MAPGEN.species = 6; }
for (let i = 0; i < args.length; i++) {
  if (args[i] !== '--set') continue;
  const [path, value] = args[i + 1].split('=');
  const [block, key] = path.split('.');
  CONFIG[block][key] = Number(value);
}
const K = opt('k', 6);
const TRIALS = opt('trials', 300);
const SEED = opt('seed', 5000);
const { SLEEP } = CONFIG;

const catalogue = [];
for (const color of TRAITS.color) for (const shape of TRAITS.shape) for (const smell of TRAITS.smell) catalogue.push({ color, shape, smell });

function score(fagi, chem, tasted) {
  let right = 0; let n = 0;
  const wary = { poison: 0, poisonN: 0, other: 0, otherN: 0 };
  for (const traits of catalogue) {
    if (tasted.has(speciesKey(traits))) continue;
    const p = predict(fagi.brain.cues, cuesOfTraits(traits));
    const poison = feedOf(chem, traits) === 'poison';
    n += 1;
    if ((p.value < -0.1) === poison) right += 1;
    if (poison) { wary.poison += wariness(p); wary.poisonN += 1; } else { wary.other += wariness(p); wary.otherN += 1; }
  }
  return { accuracy: right / n, waryPoison: wary.poison / wary.poisonN, waryOther: wary.other / wary.otherN };
}

function trial(seed, sleeps) {
  return withRng(rng(seed), () => {
    const chem = createChemistry();
    const species = createSpecies(chem, K);
    registerSpecies(species);
    const fagi = createFagi();
    for (const { key } of [...species, ...species]) {
      fagi.hunger = 50;
      eat(fagi, key);
      for (let s = 0; s < 12; s++) resolveEpisodes(fagi, 1);   // until she knows how it went
      fagi.episode = null;
      fagi.age += 20;
    }
    if (sleeps) consolidate(fagi, { night: 1, now: fagi.age });
    const out = score(fagi, chem, new Set(species.map((s) => s.key)));
    registerSpecies([]);
    return out;
  });
}

function life(i, duration, dt = 0.05) {
  const seed = SEED + i;
  const world = withRng(rng(1 + i * 13), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(seed * 7919);
  const fagiRng = rng(seed);
  const fagi = withRng(fagiRng, () => createFagi());
  const tried = new Set();
  let harmful = 0; let firstHarmful = 0;
  for (let s = 0; s < Math.ceil(duration / dt) && fagi.alive; s++) {
    withRng(worldRng, () => stepWorld(world, dt));
    const eaten = fagi.eaten;
    withRng(fagiRng, () => updateFagi(fagi, world, dt));
    if (fagi.eaten === eaten || !fagi.lastMeal) continue;
    const key = fagi.lastMeal.type;
    if (isHarmful(key)) { harmful += 1; if (!tried.has(key)) firstHarmful += 1; }
    tried.add(key);
  }
  return {
    alive: fagi.alive ? 1 : 0, cause: fagi.alive ? null : fagi.cause, harmful, firstHarmful,
    accuracy: accuracy(fagi, world.chemistry, catalogue).balanced,
    tasted: tried.size, nights: fagi.consolidations ?? 0,
  };
}

if (GAME) {
  const duration = opt('duration', 1800);
  const lives = Array.from({ length: GAME }, (_, i) => life(i, duration));
  const m = (f) => (lives.reduce((a, r) => a + f(r), 0) / lives.length).toFixed(3);
  console.log(`sleep in the game: ${GAME} lives × ${duration}s, ${CONFIG.MAPGEN.species} species; consolidate ${SLEEP.consolidate}, replay ${SLEEP.replay}, downscale ${SLEEP.downscale}`);
  console.log(`  alive ${lives.reduce((a, r) => a + r.alive, 0)}/${GAME} · harmful bites ${m((r) => r.harmful)} · first harmful ${m((r) => r.firstHarmful)} · accuracy ${m((r) => r.accuracy)} · kinds tasted ${m((r) => r.tasted)} · nights ${m((r) => r.nights)}`);
  const causes = {};
  for (const r of lives) if (r.cause) causes[r.cause] = (causes[r.cause] ?? 0) + 1;
  console.log(`  died of: ${Object.entries(causes).map(([c, n]) => `${c} ${n}`).join(' · ') || 'nothing'}`);
  process.exit(0);
}

const awake = [];
const slept = [];
for (let i = 0; i < TRIALS; i++) {
  awake.push(trial(SEED + i, false));
  slept.push(trial(SEED + i, true));
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const paired = (f) => {
  const d = slept.map((r, i) => f(r) - f(awake[i]));
  const m = mean(d);
  const se = Math.sqrt(d.reduce((a, x) => a + (x - m) ** 2, 0) / (d.length - 1) / d.length);
  return `${m >= 0 ? '+' : ''}${m.toFixed(3)} ± ${se.toFixed(3)}`;
};
const row = (label, f) => `  ${label.padEnd(14)} ${mean(awake.map(f)).toFixed(3)}  ${mean(slept.map(f)).toFixed(3)}  ${paired(f)}`;

console.log(`sleep lab: ${TRIALS} trials × ${K} species tasted twice; replay ${SLEEP.replay} rounds, rate ${SLEEP.replayRate}, downscale ${SLEEP.downscale}`);
console.log('  scored on every untasted species of the catalogue');
console.log('                 awake  slept  difference (paired, ± s.e.)');
console.log(row('accuracy', (r) => r.accuracy));
console.log(row('wary: poison', (r) => r.waryPoison));
console.log(row('wary: other', (r) => r.waryOther));
