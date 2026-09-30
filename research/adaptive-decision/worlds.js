// Step 2's battery (docs/research/plan-decision-adaptativa.md): the worlds.
//
// A map without species chemistry (nectar only: the poison of step 1 is not
// what this cycle measures), its nest and water as generateMap makes them,
// and TREES trees placed around the nest at assorted distances. Some trees
// are rich (they bear all year) and the rest poor (seasons: a short crop and
// a long rest). Nothing tells her which is which, nor when the world changes.
//
// Families:
//   stable       as built, all along
//   resources    at the change, the rich trees go bare for good and the poor
//                ones start bearing all year: what she learned of each site
//                is now wrong
//   cost         at the change, heavy ground (world.mud, movement.js) covers
//                the approach to the rich trees: they still bear, but a trip
//                there now really costs more time
//   composition  RESERVED for step 4, not to be run before: cost first, then
//                resources, at other moments
//
// The moment of the change is drawn per world from its own stream, within
// CHANGE_WINDOW, and never shown to her.

import { MAPGEN } from '../../src/config.js';
import { createWorld, addObject, nestOf } from '../../src/world.js';
import { generateMap } from '../../src/mapgen.js';
import { radiusOf, isTree } from '../../src/obstacles.js';
import { rng } from '../../scripts/batch/random.js';

export const FAMILIES = ['stable', 'resources', 'cost'];
export const RESERVED = ['composition'];

// Fixed here (step 2) and not retouched after seeing any learner.
export const WORLD_PARAMS = {
  trees: 6,
  rich: 2,                 // of them, bearing all year until a change
  minDist: 200, maxDist: 560,   // px from the nest
  change: [900, 1500],     // seconds: the window the change falls in
  mudRadius: 190,          // px around each rich tree
  mudSpeed: 0.25,          // × her speed on it
  // composition only (reserved)
  second: [1700, 2100],
};

function fits(world, x, y, r) {
  if (x < MAPGEN.margin + r || y < MAPGEN.margin + r || x > world.width - MAPGEN.margin - r || y > world.height - MAPGEN.margin - r) return false;
  return world.objects.every((o) => Math.hypot(o.x - x, o.y - y) >= r + radiusOf(o) + MAPGEN.minGap);
}

// The map: under the map's own stream (runEpisode wraps it).
export function makeWorld(params = WORLD_PARAMS) {
  const saved = { species: MAPGEN.species, trees: MAPGEN.trees };
  MAPGEN.species = 0;
  MAPGEN.trees = 0;
  let world;
  try {
    world = createWorld();
    generateMap(world);
  } finally { Object.assign(MAPGEN, saved); }
  const nest = nestOf(world);
  const start = Math.random() * Math.PI * 2;
  const trees = [];
  for (let i = 0; i < params.trees; i++) {
    for (let tries = 0; tries < 200; tries++) {
      const angle = start + (i / params.trees) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
      const d = params.minDist + Math.random() * (params.maxDist - params.minDist);
      const x = nest.x + Math.cos(angle) * d;
      const y = nest.y + Math.sin(angle) * d;
      if (!fits(world, x, y, 26)) continue;
      trees.push(addObject(world, x, y, 'tree', undefined, 'map'));
      break;
    }
  }
  // Which are rich: drawn, not the nearest nor the farthest on purpose.
  const order = trees.map((t) => ({ t, k: Math.random() })).sort((a, b) => a.k - b.k).map((x) => x.t);
  order.forEach((t, i) => { t.seasonal = i >= params.rich; t.role = i < params.rich ? 'rich' : 'poor'; });
  world.mud = [];
  return world;
}

const drawIn = (rnd, [a, b]) => a + rnd() * (b - a);

// What happens to this world and when: a schedule from its own stream.
export function scheduleOf(family, mapSeed, params = WORLD_PARAMS) {
  const rnd = rng(mapSeed * 31 + 17);
  const first = drawIn(rnd, params.change);
  const second = drawIn(rnd, params.second);
  if (family === 'stable') return [];
  if (family === 'resources') return [{ at: first, what: 'resources' }];
  if (family === 'cost') return [{ at: first, what: 'cost' }];
  if (family === 'composition') return [{ at: first, what: 'cost' }, { at: second, what: 'resources' }];
  throw new Error(`unknown family ${family}`);
}

function apply(world, what, params) {
  const trees = world.objects.filter(isTree);
  if (what === 'resources') {
    for (const t of trees) {
      if (t.role === 'rich') { t.seasonal = true; t.crop = 0; t.bare = 1e9; t.role = 'dead'; }
      else if (t.role === 'poor') { t.seasonal = false; t.bare = 0; t.role = 'rich'; }
    }
  } else if (what === 'cost') {
    for (const t of trees) if (t.role === 'rich') world.mud.push({ x: t.x, y: t.y, r: params.mudRadius, speed: params.mudSpeed });
  }
}

// runEpisode's `tick`: carries out the schedule as the clock reaches it.
export function ticker(schedule, params = WORLD_PARAMS) {
  const todo = [...schedule];
  return (world) => {
    while (todo.length && world.time >= todo[0].at) apply(world, todo.shift().what, params);
  };
}
