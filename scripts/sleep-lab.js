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
//   rules    : balanced accuracy of her rules (research/lab/truth.js), the
//              verdict she would act on
//
//   node scripts/sleep-lab.js [--k 6] [--trials 300] [--seed 5000]
//                             [--family smell|one|conj] [--night]
//                             [--set SLEEP.downscale=0] [--set SLEEP.replay=8]
//
// --night: the night also asks the local night mind (night/), and the
// difference is what it added on top of sorting the day.
//
// --game N: the same question in the game instead, N lives of --duration
// seconds with the organism on and MAPGEN.species wild species (6 unless
// --set), one map per life. Reported as is, with whatever --set says
// (--set SLEEP.consolidate=0 is the ablation): how many are alive at the
// end, harmful bites (whole and trial), the harm dose in whole fruit,
// helpful species found, and, over every fruit of the catalogue (the 96 looks,
// judged by their traits), the balanced accuracy of her rules alone and of
// her rules plus what puts her off (appetite.js aversive: would she eat it?).

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
import { isHarmful, isHelpful } from '../src/chemistry.js';
import { verdict } from '../src/learned/rules.js';
import { aversive } from '../src/appetite.js';
import { askTheNight, createNightMind } from '../src/night/index.js';

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
  CONFIG[block][key] = Number.isFinite(Number(value)) ? Number(value) : value;
}
const K = opt('k', 6);
const TRIALS = opt('trials', 300);
const SEED = opt('seed', 5000);
const FAMILY = (() => { const i = args.indexOf('--family'); return i >= 0 ? args[i + 1] : 'smell'; })();
const NIGHT = args.includes('--night');
const { SLEEP } = CONFIG;

// How right her rules are over `list` (traits objects): she avoids a fruit when
// her rules forbid pursuing it, judged by its traits, since most of the
// catalogue is not on the map (research/lab/truth.js reads the traits of the
// registered species only). Balanced over poison and the rest.
// With `gut`, what puts her off counts too (appetite.js): would she eat it?
function rulesAccuracy(fagi, chem, list, gut = false) {
  let hit = 0; let miss = 0; let fa = 0; let ok = 0;
  for (const t of list) {
    const key = speciesKey(t);
    const avoids = verdict(fagi, 'pursue', key, { traits: cuesOfTraits(t) }) === 'avoid'
      || (gut && aversive(fagi, key, cuesOfTraits(t)));
    if (feedOf(chem, t) === 'poison') { if (avoids) hit++; else miss++; } else if (avoids) fa++; else ok++;
  }
  const tpr = hit + miss ? hit / (hit + miss) : 1;
  const tnr = fa + ok ? ok / (fa + ok) : 1;
  return (tpr + tnr) / 2;
}

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
  return { accuracy: right / n, waryPoison: wary.poison / wary.poisonN, waryOther: wary.other / wary.otherN,
    rules: rulesAccuracy(fagi, chem, catalogue.filter((t) => !tasted.has(speciesKey(t)))) };
}

function trial(seed, sleeps) {
  return withRng(rng(seed), () => {
    const chem = createChemistry(Math.random, { family: FAMILY });
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
    if (sleeps) {
      // With --night both arms sleep and sort; only the second asks the night mind.
      const report = consolidate(fagi, { night: 1, now: fagi.age });
      if (NIGHT && sleeps === 'mind') { CONFIG.NIGHTAI.enabled = 1; askTheNight(fagi, report, createNightMind('local')); CONFIG.NIGHTAI.enabled = 0; }
    } else if (NIGHT) {
      consolidate(fagi, { night: 1, now: fagi.age });
    }
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
  let harmful = 0; let harmfulTrials = 0; let firstHarmful = 0; let dose = 0; let trialBites = 0;
  for (let s = 0; s < Math.ceil(duration / dt) && fagi.alive; s++) {
    withRng(worldRng, () => stepWorld(world, dt));
    const eaten = fagi.eaten;
    withRng(fagiRng, () => updateFagi(fagi, world, dt));
    if (fagi.eaten === eaten || !fagi.lastMeal) continue;
    const key = fagi.lastMeal.type;
    const portion = fagi.lastEpisode?.portion ?? 1;
    if (portion < 1) trialBites += 1;
    if (isHarmful(key)) {
      if (portion < 1) harmfulTrials += 1; else harmful += 1;
      if (!tried.has(key)) firstHarmful += 1;
      dose += portion;
    }
    tried.add(key);
  }
  const helpful = world.species.map((sp) => sp.key).filter((k) => isHelpful(k));
  return {
    alive: fagi.alive ? 1 : 0, cause: fagi.alive ? null : fagi.cause, harmful, harmfulTrials, firstHarmful, dose,
    helpfulFound: helpful.filter((k) => tried.has(k)).length / Math.max(1, helpful.length),
    accuracy: rulesAccuracy(fagi, world.chemistry, catalogue),
    judgment: rulesAccuracy(fagi, world.chemistry, catalogue, true),
    tasted: tried.size, nights: fagi.consolidations ?? 0, trials: trialBites,
    proposed: (fagi.nightLog ?? []).length,
    kept: (fagi.nightLog ?? []).filter((e) => e.accepted && e.rule).length,
    nightLog: fagi.nightLog ?? [],
    retired: fagi.brain.rules.list.filter((r) => r.source?.kind === 'night' && r.retired).length,
  };
}

if (GAME) {
  const duration = opt('duration', 1800);
  const lives = Array.from({ length: GAME }, (_, i) => life(i, duration));
  const m = (f) => (lives.reduce((a, r) => a + f(r), 0) / lives.length).toFixed(3);
  // Mean ± standard error, for what is compared across conditions.
  const ms = (f) => {
    const xs = lives.map(f);
    const mu = xs.reduce((a, b) => a + b, 0) / xs.length;
    const se = Math.sqrt(xs.reduce((a, x) => a + (x - mu) ** 2, 0) / (xs.length - 1) / xs.length);
    return `${mu.toFixed(3)} ± ${se.toFixed(3)}`;
  };
  console.log(`sleep in the game: ${GAME} lives × ${duration}s, ${CONFIG.MAPGEN.species} species; consolidate ${SLEEP.consolidate}, replay ${SLEEP.replay}, downscale ${SLEEP.downscale}, experiments ${CONFIG.EXPERIMENT.enabled}`);
  console.log(`  alive ${lives.reduce((a, r) => a + r.alive, 0)}/${GAME} · nights ${m((r) => r.nights)} · kinds tasted ${m((r) => r.tasted)} · trial bites ${m((r) => r.trials)}`);
  console.log(`  harmful: whole bites ${m((r) => r.harmful)} · trial bites ${m((r) => r.harmfulTrials)} · kinds met by mouth ${m((r) => r.firstHarmful)} · dose (whole fruit) ${ms((r) => r.dose)}`);
  console.log(`  helpful kinds found ${ms((r) => r.helpfulFound)} · over the catalogue: her rules ${ms((r) => r.accuracy)} · rules and aversion (would she eat it?) ${ms((r) => r.judgment)}`);
  if (CONFIG.NIGHTAI.enabled) {
    console.log(`  night mind: proposals ${m((r) => r.proposed)} · rules or doubts kept ${m((r) => r.kept)} · night rules later retired by what she lived ${m((r) => r.retired)}`);
    const by = {};
    for (const e of lives.flatMap((r) => r.nightLog)) {
      const type = e.proposal?.type ?? '?';
      const row = by[type] ?? (by[type] = { asked: 0, kept: 0, why: {} });
      row.asked += 1;
      if (e.accepted) row.kept += 1;
      else { const w = e.why.replace(/\d+/g, 'N'); row.why[w] = (row.why[w] ?? 0) + 1; }
    }
    for (const [type, row] of Object.entries(by)) {
      const why = Object.entries(row.why).sort((a, b) => b[1] - a[1]).map(([w, n]) => `${w} ${n}`).join('; ');
      console.log(`    ${type.padEnd(8)} asked ${row.asked} · kept ${row.kept}${why ? ` · rejected: ${why}` : ''}`);
    }
  }
  const causes = {};
  for (const r of lives) if (r.cause) causes[r.cause] = (causes[r.cause] ?? 0) + 1;
  console.log(`  died of: ${Object.entries(causes).map(([c, n]) => `${c} ${n}`).join(' · ') || 'nothing'}`);
  process.exit(0);
}

const awake = [];
const slept = [];
for (let i = 0; i < TRIALS; i++) {
  awake.push(trial(SEED + i, NIGHT ? false : false));
  slept.push(trial(SEED + i, NIGHT ? 'mind' : true));
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const paired = (f) => {
  const d = slept.map((r, i) => f(r) - f(awake[i]));
  const m = mean(d);
  const se = Math.sqrt(d.reduce((a, x) => a + (x - m) ** 2, 0) / (d.length - 1) / d.length);
  return `${m >= 0 ? '+' : ''}${m.toFixed(3)} ± ${se.toFixed(3)}`;
};
const row = (label, f) => `  ${label.padEnd(14)} ${mean(awake.map(f)).toFixed(3)}  ${mean(slept.map(f)).toFixed(3)}  ${paired(f)}`;

console.log(`sleep lab: ${TRIALS} trials × ${K} species tasted twice, chemistry '${FAMILY}'; ${NIGHT ? 'sorted vs sorted + night mind' : `awake vs slept (replay ${SLEEP.replay} rounds, rate ${SLEEP.replayRate}, downscale ${SLEEP.downscale})`}`);
console.log('  scored on every untasted species of the catalogue');
console.log('                 awake  slept  difference (paired, ± s.e.)');
console.log(row('accuracy', (r) => r.accuracy));
console.log(row('wary: poison', (r) => r.waryPoison));
console.log(row('wary: other', (r) => r.waryOther));
console.log(row('rules', (r) => r.rules));
