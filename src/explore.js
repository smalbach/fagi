// Exploring isn't wandering. Wandering is having no plan; exploring is going where
// she hasn't been yet, which is the only way to find new food and water
// before she needs them.
//
// Fagi keeps a coarse map of the world: a grid of fat cells where she
// notes where she has been. To explore she picks ONE cell —the one she knows
// least, discounting what it costs to get there— and heads for it. Choosing a destination and not
// a heading is what prevents the dance: a heading can be recomputed backwards every
// second and leave her stumbling around on the spot; a destination holds until
// she steps on it.
//
// But she doesn't walk blindly towards that cell: the cell is only the compass.
// What decides is what's in front of her. Each leg goes to a point in her field
// of view (waypointInView); on arriving, with whatever new she sees, she picks the
// next one. And every frame, if something new enters what she perceives, the
// rules in decision.js decide whether the leg is still worth it or not.
//
// The notes fade on their own: a place she hasn't stepped on in a long while becomes
// new ground again. That way she doesn't explore once and run out of world.

import { EXPLORE, WORLD, FAGI } from './config.js';
import { segmentBlocked, deepBlocked, waterZone } from './obstacles.js';
import { fearsDeep } from './swim.js';
import { fovOf, viewRangeOf, normalizeAngle } from './vision.js';

const cols = () => Math.ceil(WORLD.width / EXPLORE.cell);
const rows = () => Math.ceil(WORLD.height / EXPLORE.cell);
const diagonal = () => Math.hypot(WORLD.width, WORLD.height);

export function createExploreMap() {
  return new Float32Array(cols() * rows());
}

function cellOf(x, y) {
  const c = Math.min(cols() - 1, Math.max(0, Math.floor(x / EXPLORE.cell)));
  const r = Math.min(rows() - 1, Math.max(0, Math.floor(y / EXPLORE.cell)));
  return r * cols() + c;
}

// Being in a place marks it; everything else slowly fades.
export function markVisited(map, x, y, dt) {
  for (let k = 0; k < map.length; k++) {
    map[k] = Math.max(0, map[k] - EXPLORE.fade * dt);
  }
  const i = cellOf(x, y);
  map[i] = Math.min(EXPLORE.visitMax, map[i] + EXPLORE.visitGain * dt);
}

// The cell worth going to: the one she knows least, minus what it
// costs to get there and plus a nudge for moving away from the nest, which is where
// everything she already knows comes from.
export function exploreTarget(fagi, map, nestObj) {
  const nc = cols();
  const diag = diagonal();
  const dNestObj = nestObj ? Math.hypot(nestObj.x - fagi.x, nestObj.y - fagi.y) : 0;

  let best = null;
  for (let i = 0; i < map.length; i++) {
    const x = ((i % nc) + 0.5) * EXPLORE.cell;
    const y = (Math.floor(i / nc) + 0.5) * EXPLORE.cell;
    if (x > WORLD.width || y > WORLD.height) continue;   // cell cut off by the edge

    const dist = Math.hypot(x - fagi.x, y - fagi.y);
    let points = -map[i] - EXPLORE.distanceWeight * (dist / diag);

    if (nestObj) {
      const d = Math.hypot(nestObj.x - x, nestObj.y - y);
      points += EXPLORE.homeBias * (d - dNestObj) / diag;
    }

    if (!best || points > best.points) best = { x, y, points };
  }
  return best ? { x: best.x, y: best.y } : { x: fagi.x, y: fagi.y };
}

// What a leg ending at (x, y) is worth, for the only directive there is:
// survive. Exploring is for knowing where there's food and water before
// needing them, so it's worth what it teaches her (how little she knows that place),
// how much it brings her closer to the area she knows least (the compass) and how far it advances in
// one go; and it costs however much she has to turn to go there, which is time and energy
// she doesn't spend advancing.
function scoreLeg(fagi, map, x, y, compassRose) {
  const dist = Math.hypot(x - fagi.x, y - fagi.y);
  const toward = Math.atan2(y - fagi.y, x - fagi.x);
  const headingOf = Math.atan2(compassRose.y - fagi.y, compassRose.x - fagi.x);
  const far = Math.hypot(compassRose.x - fagi.x, compassRose.y - fagi.y) > 1;
  const advanceBy = Math.min(1, dist / viewRangeOf(fagi));
  const turn = Math.abs(normalizeAngle(toward - fagi.angle)) / Math.PI;
  return -map[cellOf(x, y)]
    + (far ? EXPLORE.compassWeight * Math.cos(normalizeAngle(toward - headingOf)) : 0)
    + EXPLORE.farWeight * advanceBy
    - EXPLORE.turnWeight * turn;
}

// The next leg, decided with what she has: the points she sees (with no rock
// in between) and, if there is one, the leg she left half done (`prior`) when
// something pulled her away. They're all scored the same and the one worth most wins: resuming isn't
// a habit or an obligation, it's one more option. If she sees no free
// point and there's no old leg (a wall of rocks ahead), the compass goes:
// she'll turn towards it and then see something else.
//
// Returns the chosen leg; `resumed` says whether it was the old one, and `rival` what
// the best alternative scored, so the console can report the comparison.
export function waypointInView(fagi, map, nestObj, world, prior = null) {
  const compassRose = exploreTarget(fagi, map, nestObj);
  const range = viewRangeOf(fagi);
  const half = fovOf(fagi) / 2;
  const marginOf = FAGI.radius * 2;
  // Whoever has already sunk once doesn't plot legs that end in or cross deep water.
  const fears = world && fearsDeep(fagi);

  let best = null;
  for (let i = 0; i < EXPLORE.rays; i++) {
    const a = fagi.angle - half + (2 * half * i) / Math.max(1, EXPLORE.rays - 1);
    for (const f of EXPLORE.depths) {
      const x = fagi.x + Math.cos(a) * range * f;
      const y = fagi.y + Math.sin(a) * range * f;
      if (x < marginOf || y < marginOf || x > WORLD.width - marginOf || y > WORLD.height - marginOf) continue;
      if (world && segmentBlocked(world, fagi.x, fagi.y, x, y)) continue;
      if (fears && (waterZone(world, x, y) || deepBlocked(world, fagi.x, fagi.y, x, y))) continue;
      const points = scoreLeg(fagi, map, x, y, compassRose);
      if (!best || points > best.points) best = { x, y, points };
    }
  }

  if (prior) {
    const points = scoreLeg(fagi, map, prior.x, prior.y, compassRose);
    if (!best || points > best.points) {
      return { x: prior.x, y: prior.y, inView: true, resumed: true, score: points, rival: best?.points ?? null };
    }
    return { x: best.x, y: best.y, inView: true, resumed: false, score: best.points, rival: points };
  }
  if (!best) return { x: compassRose.x, y: compassRose.y, inView: false };
  return { x: best.x, y: best.y, inView: true, score: best.points };
}
