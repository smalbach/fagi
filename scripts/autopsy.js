// Autopsies: how each Fagi that died got there, and whether it looks like a
// real death or an artifact of the simulation.
//
// Dying is not a failure (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §25.5): a
// real organism dies of thirst when the water is too far, or of hunger in a
// lean season. What is worth finding are deaths no animal would die: next to
// water she knows, asleep with a critical thirst, going round in circles,
// with food in her own pantry, eating again the smell that made her sick. For
// each death this keeps the last WINDOW seconds and flags what looks like an
// artifact, for a person to read.
//
//   node scripts/autopsy.js [--lives 48] [--duration 1800] [--seed 5000]
//                           [--species 6] [--window 180] [--show 4]
//                           [--set BLOCK.key=V ...] [--no-organism]

import { createWorld, nestOf } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { stepWorld } from '../src/simulation.js';
import { enableOrganism } from '../src/organism.js';
import { cycleAt } from '../src/cycle.js';
import * as CONFIG from '../src/config.js';
import { isWater, radiusOf } from '../src/obstacles.js';
import { isHarmful } from '../src/chemistry.js';
import { cuesOf } from '../src/learned/cues.js';
import { rng, withRng } from './batch/random.js';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
if (!args.includes('--no-organism')) enableOrganism();
CONFIG.MAPGEN.species = opt('species', 6);
for (let i = 0; i < args.length; i++) {
  if (args[i] !== '--set') continue;
  const [path, value] = args[i + 1].split('=');
  const [block, key] = path.split('.');
  CONFIG[block][key] = Number.isFinite(Number(value)) ? Number(value) : value;
}
const LIVES = opt('lives', 48);
const DURATION = opt('duration', 1800);
const SEED = opt('seed', 5000);
const WINDOW = opt('window', 180);
const SHOW = opt('show', 4);
const DT = 0.05;
const { NEEDS, HUNGER, THIRST, FAGI } = CONFIG;

const r1 = (v) => Math.round(v * 10) / 10;

// The real water and food, measured from where she is: what the lab knows.
function surroundings(fagi, world) {
  const waters = world.objects.filter(isWater);
  const water = Math.min(...waters.map((w) => Math.max(0, Math.hypot(w.x - fagi.x, w.y - fagi.y) - radiusOf(w))), Infinity);
  const food = world.points.filter((p) => !isHarmful(p.type));
  const nearFood = Math.min(...food.map((p) => Math.hypot(p.x - fagi.x, p.y - fagi.y)), Infinity);
  const nest = nestOf(world);
  const stock = nest ? Object.entries(nest.stock).filter(([k, n]) => n > 0 && !isHarmful(k)).reduce((a, [, n]) => a + n, 0) : 0;
  return { water, nearFood, stock };
}

function sample(fagi, world) {
  const sky = cycleAt(world.time);
  const s = surroundings(fagi, world);
  const ctx = fagi.perceived ?? {};
  return {
    t: r1(fagi.age), x: Math.round(fagi.x), y: Math.round(fagi.y),
    action: fagi.thought?.action ?? '-', rule: fagi.thought?.rule ?? '-',
    hunger: r1(fagi.hunger), thirst: r1(fagi.thirst), energy: r1(fagi.energy),
    temp: fagi.temperature != null ? r1(fagi.temperature) : null,
    night: Boolean(sky.on && sky.isNight),
    water: r1(s.water), nearFood: r1(s.nearFood), realStock: s.stock,
    rememberWater: Boolean(ctx.waterPlace || ctx.visible),
    seesWater: Boolean(ctx.visible),
    carrying: fagi.carrying?.type ?? null,
    swimming: Boolean(fagi.swimming),
  };
}

// What looks off in the last stretch. Each flag is a question for a person,
// not a verdict: the timeline is printed next to it.
function flags(life) {
  const out = [];
  const tl = life.timeline;
  // Poisoned: the hunger it caused is not hunger she failed to ease, so the
  // questions are others. Did she eat again a smell that had already made her
  // sick (aversion failing), or the very same fruit?
  if (life.cause === 'poison') {
    const smells = life.poison.map((p) => cuesOf(p.key).find((c) => c.startsWith('smell:')));
    life.poisonedBy = life.poison.map((p) => p.key);
    if (new Set(life.poisonedBy).size < life.poisonedBy.length) out.push('ate the same poison twice');
    else if (new Set(smells).size < smells.length) out.push('ate a smell that had already poisoned her');
    return out;
  }
  const need = life.cause === 'thirst' ? 'thirst' : 'hunger';
  const max = need === 'thirst' ? THIRST.max : HUNGER.max;
  const critical = tl.filter((s) => s[need] / max >= NEEDS.critical);
  if (!critical.length) return out;
  const secs = critical.length * life.every;
  const byAction = {};
  for (const s of critical) byAction[s.action] = (byAction[s.action] ?? 0) + life.every;
  life.criticalActions = Object.fromEntries(Object.entries(byAction).map(([a, v]) => [a, r1(v)]).sort((a, b) => b[1] - a[1]));

  // Standing still (asleep, resting, sheltering) while the need that kills was critical.
  const still = ['rest', 'shelter', 'toSleep', 'warmUp', 'coolDown'].reduce((a, k) => a + (byAction[k] ?? 0), 0);
  if (still >= Math.max(10, secs * 0.3)) out.push(`still ${r1(still)}s of ${r1(secs)}s critical ${need}`);

  // How much ground she covered while critical: going round in circles or stuck.
  let path = 0;
  for (let i = 1; i < critical.length; i++) path += Math.hypot(critical[i].x - critical[i - 1].x, critical[i].y - critical[i - 1].y);
  const first = critical[0]; const last = critical.at(-1);
  const net = Math.hypot(last.x - first.x, last.y - first.y);
  if (secs > 20 && path > 3 * FAGI.speed && net < path * 0.15) out.push(`circling: walked ${Math.round(path)}px, ended ${Math.round(net)}px away`);

  if (need === 'thirst') {
    const closest = Math.min(...critical.map((s) => s.water));
    if (closest < FAGI.speed * 3) out.push(`was ${Math.round(closest)}px from water while critical`);
    if (critical.some((s) => s.seesWater)) out.push('saw water while critical');
  } else {
    if (critical.some((s) => s.realStock > 0)) out.push(`nest had ${Math.max(...critical.map((s) => s.realStock))} edible rations`);
    if (critical.some((s) => s.carrying && !isHarmful(s.carrying))) out.push('died carrying edible food');
    const nearest = Math.min(...critical.map((s) => s.nearFood));
    if (nearest < FAGI.viewRange) out.push(`edible fruit within ${Math.round(nearest)}px while critical`);
  }
  return out;
}

function life(i) {
  const seed = SEED + i;
  const world = withRng(rng(1 + i * 13), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(seed * 7919);
  const fagiRng = rng(seed);
  const fagi = withRng(fagiRng, () => createFagi());
  const every = 0.5;
  const each = Math.round(every / DT);
  const keep = Math.ceil(WINDOW / every);
  const timeline = [];
  for (let s = 0; s < Math.ceil(DURATION / DT) && fagi.alive; s++) {
    withRng(worldRng, () => stepWorld(world, DT));
    withRng(fagiRng, () => updateFagi(fagi, world, DT));
    if (s % each === 0 || !fagi.alive) {
      timeline.push(sample(fagi, world));
      if (timeline.length > keep) timeline.shift();
    }
  }
  const out = { i, seed, alive: fagi.alive, age: r1(fagi.age), cause: fagi.cause, sex: fagi.sex, every, timeline, poison: fagi.poison ?? [] };
  if (!fagi.alive) out.flags = flags(out);
  return out;
}

function compact(tl, every) {
  // One line per change of action, with the state when it started.
  const rows = [];
  for (const s of tl) {
    const prev = rows.at(-1);
    if (prev && prev.s.action === s.action) { prev.until = s.t; continue; }
    rows.push({ s, until: s.t });
  }
  return rows.map(({ s, until }) => `    ${String(s.t).padStart(7)}–${String(until).padEnd(7)} ${s.action.padEnd(12)} ${s.rule.padEnd(12)} hunger ${String(s.hunger).padStart(5)} thirst ${String(s.thirst).padStart(5)} energy ${String(s.energy).padStart(5)}${s.temp != null ? ` ${s.temp}°C` : ''}${s.night ? ' night' : ''} water ${s.water}px${s.rememberWater ? '' : ' (unknown)'} stock ${s.realStock}${s.carrying ? ` carrying ${s.carrying}` : ''}`);
}

const lives = Array.from({ length: LIVES }, (_, i) => life(i));
const dead = lives.filter((l) => !l.alive);
const causes = {};
for (const l of dead) causes[l.cause] = (causes[l.cause] ?? 0) + 1;
const flagged = dead.filter((l) => l.flags.length);
console.log(`autopsy: ${LIVES} lives × ${DURATION}s, organism ${args.includes('--no-organism') ? 'off' : 'on'}, ${CONFIG.MAPGEN.species} species`);
console.log(`  died ${dead.length}: ${Object.entries(causes).map(([c, n]) => `${c} ${n}`).join(' · ') || '-'}`);
console.log(`  with something that looks like an artifact: ${flagged.length}`);
const tally = {};
for (const l of flagged) for (const f of l.flags) { const k = f.replace(/[\d.]+/g, 'N'); tally[k] = (tally[k] ?? 0) + 1; }
for (const [k, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(3)} × ${k}`);
console.log('');
for (const l of dead) {
  console.log(`life ${l.i} (seed ${l.seed}${l.sex ? `, ${l.sex}` : ''}): died of ${l.cause} at ${l.age}s`);
  if (l.criticalActions) console.log(`  while critical: ${Object.entries(l.criticalActions).map(([a, v]) => `${a} ${v}s`).join(' · ')}`);
  if (l.poisonedBy) console.log(`  poisoned by: ${l.poisonedBy.join(', ')}`);
  for (const f of l.flags) console.log(`  ! ${f}`);
}
console.log('');
for (const l of flagged.slice(0, SHOW)) {
  console.log(`--- life ${l.i}, last ${WINDOW}s ---`);
  console.log(compact(l.timeline, l.every).join('\n'));
}
