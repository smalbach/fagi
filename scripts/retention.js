// Retention over days (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md, phase 3): does
// what she learned about a fruit last, days after she last tasted it, and does
// what she learned from trial bites become rules?
//
// Every dawn, for every fruit she has tasted, it notes how many days ago she
// last tasted it and whether she still judges it rightly:
//   right  harmful: she would not eat it (rules or aversion); the rest: she would
//   ruled  a rule of hers decides about it (learned/rules.js, decidingRule)
// and whether she only ever tasted it by trial bites (experiment.js).
// Then, per days since the last taste, the share judged rightly and ruled.
//
//   node scripts/retention.js [--lives 48] [--seed 5000] [--duration 2400] [--set BLOCK.key=V ...]

import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import { enableOrganism } from '../src/organism.js';
import * as CONFIG from '../src/config.js';
import { dayAt } from '../src/cycle.js';
import { isHarmful, registerSpecies } from '../src/chemistry.js';
import { verdict, decidingRule } from '../src/learned/rules.js';
import { aversive } from '../src/appetite.js';
import { cuesOf } from '../src/learned/cues.js';
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
const SECONDS = opt('duration', 2400);
const DT = 0.05;
const BUCKETS = [0, 1, 2, 3, 4, 5];
const bucket = (d) => Math.min(d, 5);

const acc = { harmful: {}, other: {} };
const trial = { n: 0, ruled: 0, right: 0 };
const whole = { n: 0, ruled: 0, right: 0 };
for (let i = 0; i < LIVES; i++) {
  const world = withRng(rng(SEED + i), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng((SEED + i) * 7919);
  const fagiRng = rng(SEED + i);
  const fagi = withRng(fagiRng, () => createFagi());
  const last = {};    // key -> age of the last taste
  const onlyTrial = {};
  let day = dayAt(world.time);
  let eaten = 0;
  for (let s = 0; s < SECONDS / DT && fagi.alive; s++) {
    withRng(worldRng, () => stepWorld(world, DT));
    withRng(fagiRng, () => updateFagi(fagi, world, DT));
    if (fagi.eaten !== eaten && fagi.lastMeal) {
      eaten = fagi.eaten;
      const key = fagi.lastMeal.type;
      last[key] = fagi.age;
      const isTrial = (fagi.lastEpisode?.portion ?? 1) < 1;
      onlyTrial[key] = (onlyTrial[key] ?? true) && isTrial;
    }
    const d = dayAt(world.time);
    if (d === day) continue;
    day = d;
    for (const [key, at] of Object.entries(last)) {
      if (!cuesOf(key).length) continue;
      const harmful = isHarmful(key);
      const avoids = verdict(fagi, 'eat', key) === 'avoid' || aversive(fagi, key, cuesOf(key));
      const right = harmful ? avoids : !avoids;
      const ruled = Boolean(decidingRule(fagi, 'eat', key));
      const b = bucket(Math.floor((fagi.age - at) / CONFIG.CYCLE.seconds));
      const cell = (acc[harmful ? 'harmful' : 'other'][b] ??= { n: 0, right: 0, ruled: 0 });
      cell.n += 1; cell.right += right; cell.ruled += ruled;
      const t = onlyTrial[key] ? trial : whole;
      t.n += 1; t.right += right; t.ruled += ruled;
    }
  }
  registerSpecies([]);
}

const pct = (a, n) => (n ? (a / n).toFixed(2) : '–');
console.log(`${LIVES} lives × ${SECONDS}s, seed ${SEED}${args.includes('--set') ? `, ${args.filter((a, k) => args[k - 1] === '--set').join(' ')}` : ''}`);
for (const kind of ['harmful', 'other']) {
  console.log(`  ${kind}: days since last taste → right / ruled (n)`);
  console.log(`    ${BUCKETS.map((b) => `${b === 5 ? '5+' : b}: ${pct(acc[kind][b]?.right ?? 0, acc[kind][b]?.n)} / ${pct(acc[kind][b]?.ruled ?? 0, acc[kind][b]?.n)} (${acc[kind][b]?.n ?? 0})`).join('   ')}`);
}
console.log(`  only trial bites: right ${pct(trial.right, trial.n)}, ruled ${pct(trial.ruled, trial.n)} (${trial.n})`);
console.log(`  whole fruit:      right ${pct(whole.right, whole.n)}, ruled ${pct(whole.ruled, whole.n)} (${whole.n})`);
