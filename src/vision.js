// Vision: which points fall inside Fagi's cone. Pure functions.

import { FAGI, CYCLE } from './config.js';
import { statMult } from './effects.js';
import { segmentBlocked } from './obstacles.js';

// Normalizes an angle to the range [-PI, PI].
export function normalizeAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

// Angle from Fagi towards a point.
export function angleTo(fagi, point) {
  return Math.atan2(point.y - fagi.y, point.x - fagi.x);
}

export function distanceTo(fagi, point) {
  return Math.hypot(point.x - fagi.x, point.y - fagi.y);
}

// In the dark she sees less (cycle.js): the light she last felt, from full
// range at daylight down to CYCLE.nightSight of it at night.
function darkness(fagi) {
  const light = fagi.light ?? 1;
  if (light >= 1) return 1;
  const k = Math.max(0, (light - CYCLE.minLight) / (1 - CYCLE.minLight));
  return CYCLE.nightSight + (1 - CYCLE.nightSight) * k;
}

// Current range and angle, with buffs (and the dark) already applied.
export function viewRangeOf(fagi) {
  return FAGI.viewRange * statMult(fagi, 'viewRange') * darkness(fagi);
}

export function fovOf(fagi) {
  return Math.min(350, FAGI.fovDeg * statMult(fagi, 'fovDeg')) * Math.PI / 180;
}

// Visible points: within range, inside the cone and with no rock in between.
export function seenPoints(fagi, points, world = null) {
  const range = viewRangeOf(fagi);
  const halfFov = fovOf(fagi) / 2;
  const seen = [];
  for (const p of points) {
    const dist = distanceTo(fagi, p);
    if (dist > range) continue;
    const rel = normalizeAngle(angleTo(fagi, p) - fagi.angle);
    if (Math.abs(rel) > halfFov) continue;
    if (world && segmentBlocked(world, fagi.x, fagi.y, p.x, p.y)) continue; // rock in the way
    seen.push({ point: p, dist });
  }
  return seen;
}

// Does Fagi see this map object? Measures against the edge of the circle, not the center:
// a big pool is visible even if its center falls outside the cone.
export function seesObject(fagi, obj, objRadius, world) {
  const dist = Math.max(0, distanceTo(fagi, obj) - objRadius);
  if (dist > viewRangeOf(fagi)) return false;
  const rel = Math.abs(normalizeAngle(angleTo(fagi, obj) - fagi.angle));
  const margin = Math.atan2(objRadius, Math.max(1, distanceTo(fagi, obj)));
  if (rel > fovOf(fagi) / 2 + margin) return false;
  return !segmentBlocked(world, fagi.x, fagi.y, obj.x, obj.y);
}
