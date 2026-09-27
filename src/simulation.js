// One turn of the world: what happens even if Fagi does nothing.
// The order matters — the wind decides which way the plumes grow, and the
// fruit can rot right before Fagi decides to go for it.

import { updateWind } from './wind.js';
import { updateTrails } from './smell.js';
import { updatePheromone } from './pheromone.js';
import { updateTrees } from './trees.js';
import { updateFood } from './food.js';
import { updateNest } from './world.js';
import { updateRain } from './rain.js';
import { updateFagi } from './fagi.js';

export function stepWorld(world, dt) {
  world.time = (world.time ?? 0) + dt;
  updateWind(world.wind, dt);
  updateRain(world, dt);
  updateTrees(world, dt);
  updateFood(world, dt);
  updateNest(world, dt);
  updateTrails(world, dt);
  updatePheromone(world, dt);
}

export function step(world, fagi, dt) {
  stepWorld(world, dt);
  updateFagi(fagi, world, dt);
}
