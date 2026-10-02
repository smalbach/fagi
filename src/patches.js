// Ground patches (FORAGE, phase 9): now and then a handful of fruit shows up
// somewhere on the map — a branch that broke, a windfall — and is never
// renewed. Whoever finds one can go back for the rest, but not for long:
// it's the kind of find where coming back stops paying.

import { FORAGE, TREE, MAPGEN } from './config.js';
import { addPoint, nestOf, record } from './world.js';
import { drawVariant } from './chemistry.js';
import { objectAt, waterZone } from './obstacles.js';
import { seasonNow } from './seasons.js';
import { weighFruit } from './load.js';

export function updatePatches(world, dt) {
  if (!FORAGE.enabled || FORAGE.patchEvery <= 0) return;
  world.patchTimer = (world.patchTimer ?? FORAGE.patchEvery) - dt * seasonNow().fruit;   // fewer windfalls in winter (SEASONS)
  if (world.patchTimer > 0) return;
  world.patchTimer = FORAGE.patchEvery;
  dropPatch(world);
}

// What a patch is of: one of the map's species, poisonous ones included, or
// the classic fruit on a map without them.
function kindOf(world) {
  const keys = world.species?.length ? world.species.map((s) => s.key) : [TREE.fruit];
  return keys[Math.floor(Math.random() * keys.length)];
}

// A free spot: inside the map, off rocks and water, not by the nest.
function spotFor(world) {
  const nest = nestOf(world);
  const m = MAPGEN.margin + FORAGE.patchSpread;
  for (let tries = 0; tries < 60; tries++) {
    const x = m + Math.random() * (world.width - 2 * m);
    const y = m + Math.random() * (world.height - 2 * m);
    if (nest && Math.hypot(x - nest.x, y - nest.y) < FORAGE.patchMinNest) continue;
    if (objectAt(world, x, y) || waterZone(world, x, y)) continue;
    return { x, y };
  }
  return null;
}

export function dropPatch(world) {
  const at = spotFor(world);
  if (!at) return null;
  const kind = kindOf(world);
  let n = 0;
  for (let i = 0; i < FORAGE.patchSize; i++) {
    const ang = Math.random() * Math.PI * 2;
    const d = Math.random() * FORAGE.patchSpread;
    const x = at.x + Math.cos(ang) * d;
    const y = at.y + Math.sin(ang) * d;
    if (waterZone(world, x, y)) continue;
    const p = weighFruit(addPoint(world, x, y, kind, 'patch'));
    const variant = drawVariant(p.type);   // a look-alike's fruit (TASTE), as on a tree
    if (variant) p.variant = variant;
    n++;
  }
  record(world, 'patch', { x: at.x, y: at.y, what: kind, n });
  return { ...at, kind, n };
}
