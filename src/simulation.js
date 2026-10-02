// One turn of the world: what happens even if Fagi does nothing.
// The order matters — the wind decides which way the plumes grow, and the
// fruit can rot right before Fagi decides to go for it.

import { updateWind } from './wind.js';
import { updateTrails } from './smell.js';
import { updatePheromone } from './pheromone.js';
import { updateTrees } from './trees.js';
import { updatePatches } from './patches.js';
import { updateFood } from './food.js';
import { updateNest, record } from './world.js';
import { updateRain } from './rain.js';
import { updateFagi } from './fagi.js';
import { updateSisters } from './colony.js';
import { CYCLE, CONCEPT } from './config.js';
import { sproutThings } from './things.js';
import { dayAt } from './cycle.js';
import { updateSeasons } from './seasons.js';

export function stepWorld(world, dt) {
  world.time = (world.time ?? 0) + dt;
  // The sky is a function of the clock (cycle.js): only a new day is news.
  if (CYCLE.enabled) {
    const day = dayAt(world.time);
    if (day !== world.day) { world.day = day; record(world, 'day', { day }); }
  }
  updateSeasons(world);          // the time of year (SEASONS): how lean, how cold
  updateWind(world.wind, dt);
  updateRain(world, dt);
  updateTrees(world, dt);
  updatePatches(world, dt);
  updateFood(world, dt);
  updateNest(world, dt);
  updateTrails(world, dt);
  updatePheromone(world, dt);
  if (CONCEPT.enabled) sproutThings(world);   // new kinds of things, later on
}

export function step(world, fagi, dt) {
  stepWorld(world, dt);
  updateFagi(fagi, world, dt);
  // Her sisters, if she has any (colony.js): they move after her.
  if (world.colony) updateSisters(world, world.colony, dt);
}
