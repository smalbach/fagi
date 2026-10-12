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
// The marks by area, so each Fagi looks only at those she could touch: rebuilt
// each step (marks fade only in updatePheromone, before the Fagis move) and
// grown as marks are dropped in the meantime. In the trail's order, so the
// first best mark is the same one as walking the whole trail.
const CELL = 64;
const markGrids = new WeakMap();
function marksNear(world, x, y, reach) {
  const marks = world.pheromone;
  let g = markGrids.get(world);
  if (!g || g.marks !== marks || g.time !== world.time || marks.length < g.len) {
    g = { marks, time: world.time, len: 0, cells: new Map() };
    markGrids.set(world, g);
  }
  for (; g.len < marks.length; g.len++) {
    const m = marks[g.len];
    const k = Math.floor(m.x / CELL) * 100003 + Math.floor(m.y / CELL);
    let list = g.cells.get(k);
    if (!list) g.cells.set(k, list = []);
    list.push(g.len);
  }
  const found = [];
  for (let cx = Math.floor((x - reach) / CELL); cx <= Math.floor((x + reach) / CELL); cx++) {
    for (let cy = Math.floor((y - reach) / CELL); cy <= Math.floor((y + reach) / CELL); cy++) {
      const list = g.cells.get(cx * 100003 + cy);
      if (list) for (const i of list) found.push(i);
    }
  }
  found.sort((a, b) => a - b);
  return found.map((i) => marks[i]);
}

export function followPheromone(world, fagi, dNestNow, movingAway) {
  let best = null;
  let bestD = movingAway ? dNestNow : Infinity;

  for (const m of marksNear(world, fagi.x, fagi.y, PHERO.sense)) {
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
