// Adaptive tactics for the entity: behaviors that can be synthesized,
// activated, or learned through self-programming.
// None of them answers unless its condition or tactical state is active,
// so baseline innate traces remain invariant when learning is off.

import { FAGI, MOVEMENT, WORLD } from '../config.js';
import { angleTo, normalizeAngle } from '../vision.js';
import { zigzagHeading } from '../movement.js';
import { nestOf } from '../world.js';

// Crosswind sweep search: sweeps perpendicularly across the wind when looking
// for trails or resources in diffuse scent fields.
export function zigzagTactic(fagi, world, ctx, dt) {
  if (!fagi.tactics?.zigzag && !fagi.activeTactic?.zigzag) return null;
  const wind = world.wind;
  if (!wind) return null;
  const baseAngle = normalizeAngle(wind.angle + Math.PI);
  const sweepAngle = zigzagHeading(fagi, baseAngle, world.time ?? 0);
  return { action: 'track', reason: 'zigzag', target: { x: fagi.x + Math.cos(sweepAngle) * 50, y: fagi.y + Math.sin(sweepAngle) * 50 } };
}

// Perimeter patrol: circles the perimeter around the nest when needs are
// fulfilled, scouting for fresh resource drops or hazards.
export function patrolTactic(fagi, world, ctx, dt) {
  if (!fagi.tactics?.patrol && !fagi.activeTactic?.patrol) return null;
  const nest = nestOf(world);
  if (!nest) return null;
  const r = 160;
  const ang = (world.time * 0.4) % (Math.PI * 2);
  const px = nest.x + Math.cos(ang) * r;
  const py = nest.y + Math.sin(ang) * r;
  return { action: 'explore', reason: 'patrol', target: { x: px, y: py } };
}

// Strategic shelter retreat: seeks the nearest tree canopy or rock overhang
// when weather turns bad and the nest is further away.
export function shelterRetreatTactic(fagi, world, ctx, dt) {
  if (!fagi.tactics?.shelterRetreat && !fagi.activeTactic?.shelterRetreat) return null;
  if (!fagi.raining && !fagi.dark && (fagi.thermalStress ?? 0) <= 0) return null;
  const nest = nestOf(world);
  const nestDist = nest ? Math.hypot(nest.x - fagi.x, nest.y - fagi.y) : Infinity;
  // Look for a closer tree or rock
  let nearest = null;
  let minDist = nestDist;
  for (const obj of world.objects) {
    if (obj.type !== 'tree' && obj.type !== 'rock') continue;
    const d = Math.hypot(obj.x - fagi.x, obj.y - fagi.y);
    if (d < minDist) {
      minDist = d;
      nearest = obj;
    }
  }
  if (!nearest) return null;
  return { action: 'shelter', reason: 'shelterRetreat', target: nearest };
}
