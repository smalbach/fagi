// Pheromone: the trail Fagi herself leaves when she returns loaded to the nest.
//
// Each mark knows how far from the nest it was left. To get back to the food
// it's enough to follow marks with a GREATER distance than her own; to get back to the nest,
// a smaller one. They evaporate on their own, so a path no longer used disappears.

import { PHERO, RAIN } from './config.js';
import { record } from './world.js';
import { segmentBlocked } from './obstacles.js';

export function createPheromone() {
  return [];
}

export function dropPheromone(world, x, y, dNest) {
  world.pheromone.push({ x, y, dNest, life: PHERO.life });
  record(world, 'phero_drop', { x, y, dNest });
}

// Evaporates. Called once per frame.
export function updatePheromone(world, dt) {
  const marksOf = world.pheromone;
  // Rain washes the trail away: it fades RAIN.washPhero times faster.
  const step = dt * (world.rain?.on ? RAIN.washPhero : 1);
  for (let i = marksOf.length - 1; i >= 0; i--) {
    marksOf[i].life -= step;
    if (marksOf[i].life <= 0) marksOf.splice(i, 1);
  }
}

// The mark to follow from where Fagi is.
//   movingAway = true  -> towards the food (marks farther from the nest)
//   movingAway = false -> towards the nest (closer marks)
export function followPheromone(world, fagi, dNestNow, movingAway) {
  let best = null;
  let bestD = movingAway ? dNestNow : Infinity;

  for (const m of world.pheromone) {
    const d = Math.hypot(m.x - fagi.x, m.y - fagi.y);
    if (d > PHERO.sense || d < 4) continue;
    if (movingAway ? m.dNest > bestD : m.dNest < bestD) {
      // The antennae touch the ground: a mark on the other side of a rock is out of reach.
      if (segmentBlocked(world, fagi.x, fagi.y, m.x, m.y)) continue;
      bestD = m.dNest;
      best = m;
    }
  }
  return best;
}

// Strength of the pheromone underfoot, for the HUD and the console.
export function pheromoneAt(world, x, y) {
  let max = 0;
  for (const m of world.pheromone) {
    if (Math.hypot(m.x - x, m.y - y) > PHERO.sense) continue;
    max = Math.max(max, m.life / PHERO.life);
  }
  return max;
}
