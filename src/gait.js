// Her gait: how fast she goes, not where (movement.js carries it out).
//
// With MOVEMENT.enabled, three things change her pace each frame:
//   · the slope under her, read from the same height field the ground is
//     painted with (terrain/relief.js), so a hill you see is a hill she climbs:
//     uphill slows her and costs more, downhill eases her a little;
//   · caution: on ground she barely knows (the mental map, explore.js) and with
//     no need pressing, she crawls, as ants do on new ground;
//   · a sprint: racing home from rain, a pressure front or a thermal crisis, or
//     to the food or water that ends a critical need. It burns energy faster
//     and stops when she is nearly spent.
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

// Once a frame, before she moves: sets fagi.gaitSpeed (× her speed),
// fagi.gaitEffort (× the energy walking costs) and, for whoever watches her,
// fagi.cautious, fagi.sprinting and fagi.grade.
export function updateGait(fagi, world) {
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
  } else if (u < NEEDS.critical && 1 - familiarity(fagi.explored, fagi.x, fagi.y) >= MOVEMENT.cautiousThreshold) {
    fagi.cautious = true;
    fagi.gaitSpeed *= MOVEMENT.crawlSpeed;
    // Crawling is slower, not cheaper per second: she still works her legs.
  }
}
