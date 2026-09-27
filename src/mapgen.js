// Generates the map: pools and rocks scattered at random, without overlapping each other
// and leaving free the spot where Fagi spawns.

import { WORLD, MAPGEN, OBJECT_TYPES } from './config.js';
import { addObject } from './world.js';
import { radiusOf } from './obstacles.js';

function fits(world, x, y, r) {
  for (const o of world.objects) {
    // The REAL radius of the one already placed: some rocks are fatter than their type.
    const or = radiusOf(o);
    if (Math.hypot(o.x - x, o.y - y) < r + or + MAPGEN.minGap) return false;
  }
  return true;
}

// scaleOf = [min, max] over the type's radius. Without it, all the same size.
function place(world, type, count, scaleOf = null) {
  const base = OBJECT_TYPES[type].radius;
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;

  for (let n = 0; n < count; n++) {
    // Retries a few times; if the map is full, this one is skipped.
    for (let attemptOf = 0; attemptOf < 40; attemptOf++) {
      // The size is drawn on each attempt: if the big one doesn't fit, another gets in.
      // Squared, so there are many small ones and few boulders: if
      // half were huge, they'd cover the map and Fagi wouldn't find the water.
      const t = Math.random() ** 2;
      const r = scaleOf
        ? Math.round(base * (scaleOf[0] + t * (scaleOf[1] - scaleOf[0])))
        : base;
      const x = MAPGEN.margin + r + Math.random() * (WORLD.width - 2 * (MAPGEN.margin + r));
      const y = MAPGEN.margin + r + Math.random() * (WORLD.height - 2 * (MAPGEN.margin + r));
      if (Math.hypot(x - cx, y - cy) < MAPGEN.spawnClear + r) continue; // Fagi's spot
      if (!fits(world, x, y, r)) continue;
      addObject(world, x, y, type, r, 'map');
      break;
    }
  }
}

// The essential resources spawn in a ring around Fagi: not underneath
// her, but close enough that she can discover them before dying.
function placeNearSpawn(world, type, count, minDistance, maxDistance) {
  const r = OBJECT_TYPES[type].radius;
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;
  let placed = 0;
  for (let attemptOf = 0; attemptOf < count * 80 && placed < count; attemptOf++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    const x = cx + Math.cos(angle) * distance;
    const y = cy + Math.sin(angle) * distance;
    if (x < MAPGEN.margin + r || x > WORLD.width - MAPGEN.margin - r) continue;
    if (y < MAPGEN.margin + r || y > WORLD.height - MAPGEN.margin - r) continue;
    if (!fits(world, x, y, r)) continue;
    addObject(world, x, y, type, undefined, 'map');
    placed++;
  }
  if (placed < count) place(world, type, count - placed);
}

function placeFarFrom(world, type, count, origin, minDistance, maxDistance, preferredAngle) {
  const r = OBJECT_TYPES[type].radius;
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;
  let placed = 0;
  for (let attempt = 0; attempt < count * 240 && placed < count; attempt++) {
    // Favors the side opposite the nest relative to the spawn point: it matches
    // exploration that moves away from home, without revealing the exact position.
    const angle = preferredAngle + (Math.random() - 0.5) * 1.2;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    const x = origin.x + Math.cos(angle) * distance;
    const y = origin.y + Math.sin(angle) * distance;
    if (Math.hypot(x - cx, y - cy) < MAPGEN.spawnClear + r) continue;
    if (!fits(world, x, y, r)) continue;
    addObject(world, x, y, type, undefined, 'map');
    placed++;
  }
}

export function generateMap(world) {
  // The nest goes first and close to where Fagi spawns: it's her starting point.
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;
  const ang = Math.random() * Math.PI * 2;
  const nest = addObject(world, cx + Math.cos(ang) * 90, cy + Math.sin(ang) * 90, 'nest', undefined, 'map');

  placeNearSpawn(world, 'water', MAPGEN.pools, 175, 240);
  placeFarFrom(
    world, 'tree', MAPGEN.trees, nest,
    MAPGEN.treeMinNestDistance, MAPGEN.treeMaxNestDistance, ang + Math.PI,
  );
  place(world, 'rock', MAPGEN.rocks, MAPGEN.rockScale);
}
