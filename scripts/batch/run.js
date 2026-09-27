// Una corrida: una Fagi en el mapa de la semilla, y todo lo que se anota de ella.

import { createWorld, addObject, nestOf, stockCount } from '../../src/world.js';
import { isTree, isWater } from '../../src/obstacles.js';
import { pheromoneAt } from '../../src/pheromone.js';
import { generateMap } from '../../src/mapgen.js';
import { createFagi, updateFagi } from '../../src/fagi.js';
import { stepWorld } from '../../src/simulation.js';
import * as CONFIG from '../../src/config.js';
import { rng, con } from './random.js';
import { round, mean } from './stats.js';

const { WORLD } = CONFIG;

// --- el muro ---------------------------------------------------------------

// Tres rocas atravesadas a mitad de la recta que une el nido con cada recurso:
// el camino que ya aprendió deja de valer y tiene que rodear.
function block(world, r) {
  const nestObj = nestOf(world);
  const placedOnes = [];
  for (const destination of [world.objects.find(isTree), world.objects.find(isWater)]) {
    if (!nestObj || !destination) continue;
    const dx = destination.x - nestObj.x, dy = destination.y - nestObj.y;
    const L = Math.hypot(dx, dy);
    const [ux, uy] = [dx / L, dy / L];
    const [mx, my] = [nestObj.x + dx / 2, nestObj.y + dy / 2];
    for (const k of [-1, 0, 1]) {
      const x = mx - uy * k * (2 * r + 2), y = my + ux * k * (2 * r + 2);
      const collides = world.objects.some((o) => o.type !== 'rock' && Math.hypot(o.x - x, o.y - y) < r + (o.r ?? 0) + 10);
      if (!collides) placedOnes.push(addObject(world, x, y, 'rock', r, 'user'));
    }
  }
  return placedOnes.length;
}

// --- una corrida ------------------------------------------------------------

export function runOnce(opts, fagiSeed) {
  const mapRng = rng(opts.mapSeed);
  const worldRng = rng(opts.worldVaries ? fagiSeed * 7919 : opts.mapSeed + 1);
  const fagiRng = rng(fagiSeed);

  const world = con(mapRng, () => { const w = createWorld(); generateMap(w); return w; });
  const fagi = con(fagiRng, () => createFagi());
  const s = newFollow(opts, fagi);

  const steps = Math.ceil(opts.duration / opts.dt);
  for (let i = 0; i < steps && fagi.alive; i++) {
    if (opts.block != null && s.rocks === 0 && world.time >= opts.block) s.rocks = block(world, opts.rock) || -1;
    con(worldRng, () => stepWorld(world, opts.dt));
    con(fagiRng, () => updateFagi(fagi, world, opts.dt));

    const acc = fagi.thought?.action ?? '-';
    noteAction(s, fagi, acc, opts);
    notePosition(s, fagi, opts);
    noteThirst(s, fagi);
    notePhase(s, fagi, world, acc, opts);
    noteMilestones(s.milestones, fagi);
    noteVisits(s.visitedList, fagi, world);
  }

  return runSummary(fagiSeed, fagi, world, s);
}

// Todo lo que se va anotando paso a paso.
function newFollow(opts, fagi) {
  const cols = Math.ceil(WORLD.width / opts.cell);
  const rows = Math.ceil(WORLD.height / opts.cell);
  return {
    cols, rows,
    warmth: new Float64Array(cols * rows),
    actions: {},          // acción -> segundos
    secuencia: [],         // [t, acción] cada vez que cambia
    path: [],            // posición cada segundo, para comparar trayectorias
    milestones: { firstDrink: null, firstMeal: null, firstPick: null, firstStore: null },
    visitedList: [],         // ids de objetos del mapa en el orden en que los pisa
    nextPath: 0,
    // Aprendizaje: cuánto tarda en llegar al agua desde que la sed se vuelve
    // urgente (NEEDS.critical), que es cuando se pone a buscarla de verdad.
    // Si aprende dónde está, la primera vez debería costar más que las demás.
    latencies: [],
    thirstFrom: null,
    wasDrinking: false,

    // Viajes a por más comida: desde que sale sin carga y con la despensa sin
    // llenar (según la recuerda) hasta que recoge algo. Con la despensa llena no
    // va a por comida, explora: eso no cuenta como ida. Se parten en
    // antes/después del muro (--block).
    phaseList: { before: newPhase(), after: newPhase() },
    journeyFrom: null,
    picked: 0,
    rocks: 0,
    prev: { x: fagi.x, y: fagi.y },
  };
}

function noteAction(s, fagi, acc, opts) {
  s.actions[acc] = (s.actions[acc] ?? 0) + opts.dt;
  if (s.secuencia.at(-1)?.[1] !== acc) s.secuencia.push([round(fagi.age), acc]);
}

function notePosition(s, fagi, opts) {
  const c = Math.min(s.cols - 1, Math.max(0, Math.floor(fagi.x / opts.cell)));
  const r = Math.min(s.rows - 1, Math.max(0, Math.floor(fagi.y / opts.cell)));
  s.warmth[r * s.cols + c] += opts.dt;

  if (fagi.age >= s.nextPath) { s.path.push([fagi.x, fagi.y]); s.nextPath += 1; }
}

function noteThirst(s, fagi) {
  if (!fagi.drinking && s.thirstFrom == null && fagi.thirst / CONFIG.THIRST.max >= CONFIG.NEEDS.critical) s.thirstFrom = fagi.age;
  if (fagi.drinking && !s.wasDrinking && s.thirstFrom != null) { s.latencies.push(round(fagi.age - s.thirstFrom)); s.thirstFrom = null; }
  if (fagi.drinking) s.thirstFrom = null;
  s.wasDrinking = fagi.drinking;
}

function notePhase(s, fagi, world, acc, opts) {
  const phase = opts.block != null && world.time >= opts.block ? s.phaseList.after : s.phaseList.before;
  phase.t += opts.dt;
  const searching = !fagi.carrying && stockCount(fagi.pantry) < CONFIG.NEST.full;
  if ((fagi.picked ?? 0) > s.picked && s.journeyFrom != null) { phase.journeys.push(fagi.age - s.journeyFrom); s.journeyFrom = null; }
  else if (!searching) s.journeyFrom = null;
  else if (s.journeyFrom == null) s.journeyFrom = fagi.age;
  s.picked = fagi.picked ?? 0;
  if (s.journeyFrom != null) {
    phase.trip += opts.dt;
    const trailOf = pheromoneAt(world, fagi.x, fagi.y) > 0.05;
    if (trailOf) phase.tripWithTrail += opts.dt;
    if (acc === 'pheromone') phase.tripPheromone += opts.dt;
    phase.tripActionTimes[acc] = (phase.tripActionTimes[acc] ?? 0) + opts.dt;
    if (trailOf && acc !== 'pheromone') phase.trailIgnored += opts.dt;
    if (fagi.target && world.objects.includes(fagi.target) && isTree(fagi.target)) phase.tripTreeMemory += opts.dt;
  }
  const still = ['rest', 'drink', 'eatCarried', 'pantry'].includes(acc) || fagi.drinking;
  if (!still && Math.hypot(fagi.x - s.prev.x, fagi.y - s.prev.y) < 5 * opts.dt) phase.stuckTime += opts.dt;
  s.prev = { x: fagi.x, y: fagi.y };
  const lat = s.latencies.at(-1);
  if (fagi.drinking && s.latencies.length && lat !== phase.lastLat) { phase.water.push(lat); phase.lastLat = lat; }
}

function noteMilestones(milestones, fagi) {
  if (milestones.firstDrink == null && fagi.drunk > 0) milestones.firstDrink = round(fagi.age);
  if (milestones.firstMeal == null && fagi.eaten > 0) milestones.firstMeal = round(fagi.age);
  if (milestones.firstPick == null && (fagi.picked ?? 0) > 0) milestones.firstPick = round(fagi.age);
  if (milestones.firstStore == null && (fagi.stored ?? 0) > 0) milestones.firstStore = round(fagi.age);
}

function noteVisits(visitedList, fagi, world) {
  for (const o of world.objects) {
    if (visitedList.includes(o.id)) continue;
    if (Math.hypot(o.x - fagi.x, o.y - fagi.y) <= (o.r ?? 0) + 4) visitedList.push(o.id);
  }
}

function runSummary(fagiSeed, fagi, world, s) {
  return {
    seed: fagiSeed,
    alive: fagi.alive,
    lived: round(fagi.age),
    cause: fagi.alive ? null : fagi.cause,
    eaten: fagi.eaten,
    drunk: round(fagi.drunk),
    picked: fagi.picked ?? 0,
    stored: fagi.stored ?? 0,
    exploreLegs: fagi.exploreLegs,
    rules: fagi.brain.rules?.list?.length ?? 0,
    ...s.milestones,
    waterFirst: s.latencies[0] ?? null,
    waterLater: s.latencies.length > 1 ? round(mean(s.latencies.slice(1))) : null,
    waterTrips: s.latencies.length,
    rocks: s.rocks,
    phases: Object.fromEntries(Object.entries(s.phaseList).map(([k, f]) => [k, phaseSummary(f)])),
    visited: s.visitedList.map((id) => `${world.objects.find((o) => o.id === id)?.type ?? '?'}#${id}`),
    actions: Object.fromEntries(Object.entries(s.actions).map(([k, v]) => [k, round(v)])),
    sequence: s.secuencia,
    heat: Array.from(s.warmth),
    path: s.path,
    fingerprint: fingerprintOf(fagi, world),
  };
}

function newPhase() {
  return { t: 0, journeys: [], trip: 0, tripWithTrail: 0, tripPheromone: 0, trailIgnored: 0, tripTreeMemory: 0, stuckTime: 0, water: [], lastLat: null, tripActionTimes: {} };
}

function phaseSummary(f) {
  const pct = (x) => (f.trip ? round((x / f.trip) * 100) : null);
  return {
    seconds: round(f.t),
    foodTrips: f.journeys.length,
    foodTrip: f.journeys.length ? round(mean(f.journeys)) : null,
    onTrail: pct(f.tripWithTrail),         // % de la ida con feromona bajo las patas
    followsTrail: pct(f.tripPheromone),     // % de la ida en acción 'pheromone'
    ignoresTrail: pct(f.trailIgnored),  // % de la ida con rastro pero haciendo otra cosa
    byMemory: pct(f.tripTreeMemory),     // % de la ida yendo al árbol que recuerda
    stuck: round(f.stuckTime),
    waterTrip: f.water.length ? round(mean(f.water)) : null,
    tripActions: Object.fromEntries(Object.entries(f.tripActionTimes).map(([k, v]) => [k, pct(v)])),
  };
}

// Resumen del estado final: si dos corridas con la misma semilla dan distinta
// huella, hay azar que se escapa de las semillas (Date.now, estado global...).
function fingerprintOf(fagi, world) {
  const s = JSON.stringify([fagi.x, fagi.y, fagi.age, fagi.hunger, fagi.thirst, fagi.energy, world.points.length, world.objects.length, world.nextId]);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
}
