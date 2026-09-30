// Revision 1's battery (docs/research/plan-decision-adaptativa.md): worlds
// where what she eats decides whether she lives.
//
// The map is step 1's experimental one: generateMap with MAPGEN.species wild
// species, each a tree, under a taste chemistry (some poison, some nourishing,
// some with a poisonous look-alike), seasons and ground patches. Families:
//   stable    the chemistry never changes
//   invert    at the change, the chemistry turns upside down: what nourished
//             poisons and what poisoned nourishes (chemistry.js invertChemistry);
//             fruit already on the ground or in the nest changes with it
//   novel     at the change, NOVEL new species appear, a tree each, some of
//             them poison: kinds she has never met
//   composition  RESERVED for step 4, not to be run before: novel first,
//             then invert, at other moments
// The moment of the change is drawn per world from its own stream, within
// CHANGE, and never shown to her.

import { MAPGEN } from '../../src/config.js';
import { addObject, nestOf, record } from '../../src/world.js';
import { invertChemistry, speciesUnder, registerSpecies, createSpecies, addSpecies } from '../../src/chemistry.js';
import { radiusOf } from '../../src/obstacles.js';
import { rng, withRng } from '../../scripts/batch/random.js';

export const FOOD_FAMILIES = ['stable', 'invert', 'novel'];
export const FOOD_RESERVED = ['composition'];

// Fixed here (revision 1, step 2) and not retouched after seeing any learner.
export const FOOD_PARAMS = {
  change: [900, 1500],     // seconds: the window the change falls in
  second: [1700, 2100],    // composition only (reserved)
  novel: 3,                // new species in `novel`
  minDist: 200, maxDist: 480,
};

const drawIn = (rnd, [a, b]) => a + rnd() * (b - a);

export function foodSchedule(family, mapSeed, params = FOOD_PARAMS) {
  const rnd = rng(mapSeed * 37 + 11);
  const first = drawIn(rnd, params.change);
  const second = drawIn(rnd, params.second);
  if (family === 'stable') return [];
  if (family === 'invert') return [{ at: first, what: 'invert' }];
  if (family === 'novel') return [{ at: first, what: 'novel' }];
  if (family === 'composition') return [{ at: first, what: 'novel' }, { at: second, what: 'invert' }];
  throw new Error(`unknown family ${family}`);
}

function invert(world) {
  world.chemistry = invertChemistry(world.chemistry);
  world.species = world.species.map((sp) => speciesUnder(world.chemistry, sp.spec.traits));
  registerSpecies(world.species);
  record(world, 'chemistry', { inverted: world.chemistry.inverted });
}

function fits(world, x, y, r) {
  if (x < MAPGEN.margin + r || y < MAPGEN.margin + r || x > world.width - MAPGEN.margin - r || y > world.height - MAPGEN.margin - r) return false;
  return world.objects.every((o) => Math.hypot(o.x - x, o.y - y) >= r + radiusOf(o) + MAPGEN.minGap);
}

// New species under the world's chemistry, a tree each around the nest.
function novel(world, rnd, params) {
  const fresh = withRng(rnd, () => createSpecies(world.chemistry, params.novel, rnd));
  addSpecies(fresh);
  world.species = [...world.species, ...fresh];
  const nest = nestOf(world);
  for (const { key } of fresh) {
    for (let tries = 0; tries < 200; tries++) {
      const angle = rnd() * Math.PI * 2;
      const d = params.minDist + rnd() * (params.maxDist - params.minDist);
      const x = nest.x + Math.cos(angle) * d;
      const y = nest.y + Math.sin(angle) * d;
      if (!fits(world, x, y, 26)) continue;
      const tree = addObject(world, x, y, 'tree', undefined, 'map');
      tree.fruit = key;
      record(world, 'obj_fruit', { id: tree.id, what: key });
      break;
    }
  }
}

// runEpisode's `tick`: carries out the schedule as the clock reaches it.
export function foodTicker(schedule, mapSeed, params = FOOD_PARAMS) {
  const todo = [...schedule];
  const rnd = rng(mapSeed * 41 + 5);
  return (world) => {
    while (todo.length && world.time >= todo[0].at) {
      const { what } = todo.shift();
      if (what === 'invert') invert(world);
      else novel(world, rnd, params);
    }
  };
}
