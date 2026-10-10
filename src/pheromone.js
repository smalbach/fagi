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
  world.pheromone.push({ x, y, dNest, born: world.time ?? 0, wet: 0, life: PHERO.life });
  record(world, 'phero_drop', { x, y, dNest });
}

// Evaporates. Called once per frame. Its life is counted from when it was left,
// not by subtracting each frame: that way the replay (recorder/replay.js), which
// only knows when it was left, gets exactly the same number.
export function updatePheromone(world, dt) {
  const marksOf = world.pheromone;
  const now = world.time ?? 0;
  // Rain washes the trail away: it fades RAIN.washPhero times faster.
  const raining = Boolean(world.rain?.on);
  // The ones still alive are moved down in place, in order: splicing each dead
  // mark out moved the whole rest of the trail every time.
  let kept = 0;
  for (let i = 0; i < marksOf.length; i++) {
    const m = marksOf[i];
    if (m.born === undefined) {
      // A mark from an older save: it keeps counting down frame by frame.
      m.life -= dt * (raining ? RAIN.washPhero : 1);
    } else {
      if (raining) m.wet += dt;
      m.life = PHERO.life - (now - m.born) - (RAIN.washPhero - 1) * m.wet;
    }
    if (m.life > 0) marksOf[kept++] = m;
  }
  marksOf.length = kept;
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
    // Her antennae reach forward: a mark behind her she doesn't touch.
    if (PHERO.ahead && (m.x - fagi.x) * Math.cos(fagi.angle) + (m.y - fagi.y) * Math.sin(fagi.angle) <= 0) continue;
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
