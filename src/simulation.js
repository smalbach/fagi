// Un turno del mundo: lo que pasa aunque Fagi no haga nada.
// El orden importa — el viento decide hacia dónde crecen las estelas, y la
// fruta puede pudrirse justo antes de que Fagi decida ir a por ella.

import { updateWind } from './wind.js';
import { updateTrails } from './smell.js';
import { updatePheromone } from './pheromone.js';
import { updateTrees } from './trees.js';
import { updateFood } from './food.js';
import { updateNest } from './world.js';
import { updateFagi } from './fagi.js';

export function stepWorld(world, dt) {
  world.time = (world.time ?? 0) + dt;
  updateWind(world.wind, dt);
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
