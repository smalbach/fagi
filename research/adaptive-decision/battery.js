// Step 2: runs a controller over the battery's development worlds
// (worlds.js). Resumable: every episode is its own process and file.
//
// Two batteries: --domain where (worlds.js, the discarded one of step 2) and
// --domain food (foodworlds.js, revision 1), where --controller names a
// judge for the bite point (judges.js).
//
//   node research/adaptive-decision/battery.js [--domain food] [--group dev|val|conf] --controller choice [--tag name] [--set '{"HUNGER.rate":0.2}']
//        [--world '{"trees":3}'] [--families stable,resources,cost] [--worlds 40] [--jobs 12] [--out research/results/adaptive-decision/battery]
//
// One alone: node research/adaptive-decision/battery.js --piece <json> <file>

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { enableOrganism } from '../../src/organism.js';
import { set, runEpisode } from './episode.js';
import { BATTERY, BATTERY_HORIZON, DEV_SEED, devMapSeed, DEV_WORLDS, FOOD, GROUPS } from './design.js';
import { foodSchedule, foodTicker, FOOD_FAMILIES, FOOD_PARAMS } from './foodworlds.js';
import './judges.js';
import '../../src/adaptive-decision/index.js';
import './competitors.js';
import { makeWorld, scheduleOf, ticker, FAMILIES, WORLD_PARAMS } from './worlds.js';
import { setup } from './controllers.js';

const argv = process.argv.slice(2);
const opt = (name, dflt) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : dflt);

export function battleEpisode({ domain = 'where', controller, family, i, sets = {}, world = {}, group = 'dev' }) {
  if (domain === 'food') return foodEpisode({ controller, family, i, sets, world, group });
  const params = { ...WORLD_PARAMS, ...world };
  enableOrganism();
  set(BATTERY);
  set(sets);
  setup(controller);
  const mapSeed = devMapSeed(i);
  const schedule = scheduleOf(family, mapSeed, params);
  const r = runEpisode({
    seed: DEV_SEED + i, mapSeed, horizon: BATTERY_HORIZON,
    makeWorld: () => makeWorld(params), tick: ticker(schedule, params),
  });
  return { controller, family, i, change: schedule[0]?.at ?? null, ...r };
}

// Revision 1: the experimental map of step 1, the connected choice for where
// to go, and `controller` judging what to eat.
function foodEpisode({ controller, family, i, sets, world, group }) {
  const params = { ...FOOD_PARAMS, ...world };
  enableOrganism();
  set(FOOD);
  set(sets);
  set({ 'DECIDE.eat': controller });
  const g = GROUPS[group];
  const mapSeed = g.map(i);
  const schedule = foodSchedule(family, mapSeed, params);
  const t0 = process.hrtime.bigint();
  const r = runEpisode({ seed: g.seed + i, mapSeed, horizon: BATTERY_HORIZON, tick: foodTicker(schedule, mapSeed, params) });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  return { domain: 'food', group, controller, family, i, change: schedule[0]?.at ?? null, ms: Math.round(ms), ...r };
}

if (argv[0] === '--piece') {
  const row = battleEpisode(JSON.parse(argv[1]));
  writeFileSync(argv[2], JSON.stringify(row));
  process.exit(0);
}

const run = promisify(execFile);
const domain = opt('--domain', 'where');
const controller = opt('--controller', domain === 'food' ? 'current' : 'choice');
const group = opt('--group', 'dev');
const tag = opt('--tag', `${group === 'dev' ? '' : `${group}-`}${controller.replaceAll(':', '_')}`);
const sets = JSON.parse(opt('--set', '{}'));
const world = JSON.parse(opt('--world', '{}'));
const families = opt('--families', (domain === 'food' ? FOOD_FAMILIES : FAMILIES).join(',')).split(',');
const N = Number(opt('--worlds', DEV_WORLDS));
const JOBS = Number(opt('--jobs', 12));
const OUT = opt('--out', `research/results/adaptive-decision/${domain === 'food' ? 'food' : 'battery'}`);
const self = fileURLToPath(import.meta.url);

mkdirSync(`${OUT}/${tag}`, { recursive: true });
writeFileSync(`${OUT}/${tag}/run.json`, JSON.stringify({ domain, group, controller, sets, world, families, worlds: N }, null, 1));
const todo = [];
for (let i = 0; i < N; i++) for (const f of families) {
  const file = `${OUT}/${tag}/${f}-${i}.json`;
  if (!existsSync(file)) todo.push([f, i, file]);
}
let done = 0;
const total = todo.length;
async function worker() {
  while (todo.length) {
    const [family, i, file] = todo.shift();
    await run('node', [self, '--piece', JSON.stringify({ domain, controller, family, i, sets, world, group }), `${file}.tmp`], { maxBuffer: 1 << 26 });
    renameSync(`${file}.tmp`, file);
    done += 1;
    if (done % 20 === 0 || done === total) console.log(`${tag}: ${done}/${total}`);
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));
