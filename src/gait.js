// Her gait: how fast she goes, not where (movement.js carries it out).
//
// With MOVEMENT.enabled, three things change her pace each frame:
//   · the slope under her, read from the same height field the ground is
//     painted with (terrain/relief.js), so a hill you see is a hill she climbs:
//     uphill slows her and costs more, downhill eases her a little;
//   · caution: the less she knows the ground (the mental map, explore.js), with
//     no need pressing, the slower she goes, as ants do on new ground; how much
//     is hers (a temperament drawn once, bolder or shyer), and it grows
//     smoothly with how new the ground is, not at a threshold (before
//     2026-10-10 it was one switch: every Fagi crawled at half speed on a new
//     map, then all sped up at once); it is how new the ground has felt over
//     the last few seconds, and going home she has none;
//   · a sprint: racing home from rain, a pressure front or a thermal crisis, or
//     to the food or water that ends a critical need. It burns energy faster
//     and stops when she is nearly spent.
// Her pace follows all this with some inertia (MOVEMENT.ease s), not frame by frame.
// Off, she keeps one pace everywhere, as before.

import { MOVEMENT, TERRAIN, NEEDS, HUNGER, THIRST, THERMAL } from './config.js';
import { field } from './terrain/relief.js';
import { seededRng } from './sprite-kit.js';
import { familiarity } from './explore.js';
import { nestUnder } from './nest.js';
import { energyMax } from './biology.js';

// The height field of a map, rebuilt only when the map changes. It must draw
// its numbers exactly as the painted ground does (terrain/ground.js: the
// height field is the first thing taken from seededRng(world.seed)).
let height = { key: null, at: null };
function heightOf(world) {
  if (world?.seed == null) return null;   // a map not yet painted: flat
  const w = Math.round(world.width);
  const h = Math.round(world.height);
  const key = `${world.seed}|${w}|${h}|${TERRAIN.heightScale}`;
  if (height.key !== key) height = { key, at: field(w, h, seededRng(world.seed), TERRAIN.heightScale, 5) };
  return height.at;
}

const LOOK = 10;   // px ahead and behind where the slope is read

// The grade along her heading: + uphill, − downhill, in height-field units per
// TERRAIN.heightScale px. Measured over five maps: median 0.38, 1 in 10 steps
// above 0.93, the steepest about 2.2.
export function gradeAt(world, x, y, angle) {
  const at = heightOf(world);
  if (!at) return 0;
  const dx = Math.cos(angle) * LOOK;
  const dy = Math.sin(angle) * LOOK;
  return ((at(x + dx, y + dy) - at(x - dx, y - dy)) / (2 * LOOK)) * TERRAIN.heightScale;
}

// Speed factor of a grade. Uphill: ×0.91 on a median slope, ×0.81 on a steep
// one, ×0.64 on the steepest. Downhill a little faster, never over ×1.1.
export function slopeFactor(grade) {
  const g = grade * (MOVEMENT.slope ?? 1);
  return g >= 0 ? 1 / (1 + 0.25 * g) : Math.min(1.1, 1 - 0.08 * g);
}

// The worst of her needs right now (0-1).
function urgency(fagi) {
  let u = Math.max(fagi.hunger / HUNGER.max, fagi.thirst / THIRST.max);
  if (THERMAL.enabled) u = Math.max(u, (fagi.thermalStress ?? 0) / THERMAL.maxStress);
  return u;
}

// Is she racing for her life? Home from the weather or the heat, or to what
// ends a critical need.
function racing(fagi, world, u) {
  const kind = fagi.targetKind;
  if (kind === 'nest' && !nestUnder(fagi, world)) {
    if (fagi.raining || fagi.pressureFalling) return true;
    if (THERMAL.enabled && (fagi.thermalStress ?? 0) >= THERMAL.reflex * THERMAL.maxStress) return true;
  }
  return u >= NEEDS.critical && (kind === 'food' || kind === 'water' || kind === 'shore' || kind === 'nest');
}

// Going home (for the night, to rest, with food): she runs her way back, as a
// homing ant does; caution is for the ground she goes out to.
const homing = (fagi, world) => fagi.targetKind === 'nest' && !nestUnder(fagi, world);

// How shy she is on new ground: ×0.6–1.4 of the crawl, drawn once.
const shyness = (fagi) => (fagi.shyness ??= 0.6 + 0.8 * Math.random());

// How new the ground feels to her: what she has walked over the last few
// seconds (MOVEMENT.feel), not each patch of her mental map as she crosses it.
// Patch by patch, her pace flicked slow and fast along one path (2026-10-10).
function feelNewness(fagi, dt) {
  const now = 1 - familiarity(fagi.explored, fagi.x, fagi.y);
  if (dt == null || fagi.feltNew == null || !(MOVEMENT.feel > 0)) fagi.feltNew = now;
  else fagi.feltNew += (now - fagi.feltNew) * Math.min(1, dt / MOVEMENT.feel);
}

// 0 on ground that feels known, rising smoothly to 1 on ground wholly new.
function newness(fagi) {
  const n = fagi.feltNew ?? 1 - familiarity(fagi.explored, fagi.x, fagi.y);
  const lo = MOVEMENT.cautiousThreshold - 0.3;
  const t = Math.min(1, Math.max(0, (n - lo) / (1 - lo)));
  return t * t * (3 - 2 * t);
}

// Once a frame, before she moves: sets fagi.gaitSpeed (× her speed),
// fagi.gaitEffort (× the energy walking costs) and, for whoever watches her,
// fagi.cautious, fagi.sprinting and fagi.grade. With `dt` her pace eases to
// the new one over MOVEMENT.ease s; without it (tests), it is set at once.
export function updateGait(fagi, world, dt = null) {
  const before = fagi.gaitSpeed ?? 1;
  feelNewness(fagi, dt);
  setGait(fagi, world);
  if (dt != null && MOVEMENT.enabled && MOVEMENT.ease > 0) {
    fagi.gaitSpeed = before + (fagi.gaitSpeed - before) * Math.min(1, dt / MOVEMENT.ease);
  }
}

function setGait(fagi, world) {
  fagi.cautious = false;
  fagi.sprinting = false;
  fagi.grade = 0;
  fagi.gaitSpeed = 1;
  fagi.gaitEffort = 1;
  if (!MOVEMENT.enabled || fagi.swimming) return;

  if (MOVEMENT.terrainAdapt) {
    fagi.grade = gradeAt(world, fagi.x, fagi.y, fagi.angle);
    const f = slopeFactor(fagi.grade);
    fagi.gaitSpeed *= f;
    // Climbing costs what it slows; going down costs no less than the flat.
    fagi.gaitEffort *= Math.max(1, 1 / f);
  }

  const u = urgency(fagi);
  const spare = fagi.energy / energyMax(fagi) > (MOVEMENT.sprintEnergy ?? 0.15);
  if (MOVEMENT.sprintMult > 1 && spare && racing(fagi, world, u)) {
    fagi.sprinting = true;
    fagi.gaitSpeed *= MOVEMENT.sprintMult;
    fagi.gaitEffort *= MOVEMENT.sprintMult;
  } else if (u < NEEDS.critical && !homing(fagi, world)) {
    const caution = Math.min(1, newness(fagi) * shyness(fagi));
    fagi.cautious = caution >= 0.5;
    fagi.gaitSpeed *= 1 - (1 - MOVEMENT.crawlSpeed) * caution;
    // Crawling is slower, not cheaper per second: she still works her legs.
  }
}
