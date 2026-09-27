// Map objects: water to drink from and rocks that get in the way.
// Pure geometry, with no state of its own.

import { OBJECT_TYPES, FAGI, WATER } from './config.js';

export function isWater(obj) {
  return OBJECT_TYPES[obj.type].kind === 'water';
}

export function isBlock(obj) {
  return OBJECT_TYPES[obj.type].kind === 'block';
}

export function isNest(obj) {
  return OBJECT_TYPES[obj.type].kind === 'nest';
}

export function isTree(obj) {
  return OBJECT_TYPES[obj.type].kind === 'spawner';
}

export function radiusOf(obj) {
  return obj.r ?? OBJECT_TYPES[obj.type].radius;
}

// Is Fagi inside some pool? Returns the pool or null.
export function waterUnder(world, fagi) {
  return waterZone(world, fagi.x, fagi.y)?.pool ?? null;
}

// Radius of a pool's deep water: everything except the band of shallows.
export function deepRadius(o) {
  if (OBJECT_TYPES[o.type].shallow) return 0;
  return Math.max(0, radiusOf(o) - WATER.shallows);
}

// What's under (x, y): { pool, deep } if it's water (deep = she can't stand), or null.
export function waterZone(world, x, y) {
  for (const o of world.objects) {
    if (!isWater(o)) continue;
    const d = Math.hypot(o.x - x, o.y - y);
    if (d <= radiusOf(o)) return { pool: o, deep: d < deepRadius(o) };
  }
  return null;
}

// The pool behind a target: the pool itself or the place she remembers of
// it (memory.js keeps the real object in `ref`). null if it isn't water.
export function poolOf(target) {
  const o = target?.ref ?? target;
  return OBJECT_TYPES[o?.type]?.kind === 'water' ? o : null;
}

// The point on the shore closest to `from`, `inset` px inside the edge.
// `center` is where she believes the pool is (the real one, or the remembered one).
export function shorePoint(center, r, from, inset) {
  let dx = from.x - center.x;
  let dy = from.y - center.y;
  const d = Math.hypot(dx, dy);
  if (d === 0) { dx = Math.cos(from.angle ?? 0); dy = Math.sin(from.angle ?? 0); }
  else { dx /= d; dy /= d; }
  return { x: center.x + dx * (r - inset), y: center.y + dy * (r - inset) };
}

// Does segment A-B go into some pool's deep water? It doesn't block sight: it's only
// used for walking by whoever has already learned to fear it. Deep water that already contains A doesn't
// count: if she's inside, what she has to do is get out, not be left with no heading. And if
// A is already on the margin, the margin is ignored: otherwise, every heading would come out blocked.
export function deepBlocked(world, ax, ay, bx, by, margin = 0) {
  for (const o of world.objects) {
    if (!isWater(o)) continue;
    const deep = deepRadius(o);
    if (deep <= 0) continue;
    const d = Math.hypot(o.x - ax, o.y - ay);
    if (d < deep) continue;   // the same limit as waterZone: inside is deep
    const r = d < deep + margin ? deep : deep + margin;
    if (segmentEntersCircle(ax, ay, bx, by, o.x, o.y, r)) return true;
  }
  return false;
}

// Like segmentHitsCircle, but it only counts if the segment goes INTO the circle.
// From the edge itself, a segment that moves away or grazes it isn't blocked: if it
// were, right by the shore every heading would come out blocked and she'd get stuck.
function segmentEntersCircle(ax, ay, bx, by, cx, cy, r) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return false;
  const t = Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / len2);
  if (t <= 0) return false;
  return Math.hypot(cx - (ax + dx * t), cy - (ay + dy * t)) < r;
}

// Does segment A-B cross any rock? Used to block vision.
// `margin` fattens each rock: to know whether Fagi's body fits, not just a ray.
export function segmentBlocked(world, ax, ay, bx, by, margin = 0) {
  for (const o of world.objects) {
    if (!isBlock(o)) continue;
    if (segmentHitsCircle(ax, ay, bx, by, o.x, o.y, radiusOf(o) + margin)) return true;
  }
  return false;
}

function segmentHitsCircle(ax, ay, bx, by, cx, cy, r) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  // Point of the segment closest to the center of the circle.
  let t = len2 === 0 ? 0 : ((cx - ax) * dx + (cy - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = ax + dx * t;
  const py = ay + dy * t;
  return Math.hypot(cx - px, cy - py) <= r;
}

// If Fagi got into a rock, pushes her out by the shortest way.
// Returns true if there was a collision, so she can change heading.
export function pushOutOfBlocks(fagi, world) {
  let hit = false;
  for (const o of world.objects) {
    if (!isBlock(o)) continue;
    const min = radiusOf(o) + FAGI.radius;
    let dx = fagi.x - o.x;
    let dy = fagi.y - o.y;
    let dist = Math.hypot(dx, dy);
    if (dist >= min) continue;
    if (dist === 0) { dx = 1; dy = 0; dist = 1; } // right at the center
    fagi.x = o.x + (dx / dist) * min;
    fagi.y = o.y + (dy / dist) * min;
    hit = true;
  }
  return hit;
}

// Looks a little ahead: if there's a rock, returns which side to dodge it on.
// With `fearDeep` it also dodges deep water, as if it were rock.
// 0 = clear path.
export function avoidanceTurn(fagi, world, fearDeep = false) {
  const look = FAGI.radius + 34;
  const ahead = {
    x: fagi.x + Math.cos(fagi.angle) * look,
    y: fagi.y + Math.sin(fagi.angle) * look,
  };
  for (const o of world.objects) {
    const r = isBlock(o) ? radiusOf(o) + FAGI.radius
      : fearDeep && isWater(o) && deepRadius(o) > 0 && !waterZone(world, fagi.x, fagi.y)?.deep ? deepRadius(o) + WATER.shallows / 2
      : null;
    if (r === null) continue;
    const dist = Math.hypot(o.x - ahead.x, o.y - ahead.y);
    if (dist > r) continue;
    // Cross product: tells whether the rock is on the left or the right.
    const side = Math.sign(
      Math.cos(fagi.angle) * (o.y - fagi.y) - Math.sin(fagi.angle) * (o.x - fagi.x)
    ) || 1;
    return -side; // turn towards the opposite side
  }
  return 0;
}

// Map object under a point (for deleting with right click).
export function objectAt(world, x, y) {
  for (let i = world.objects.length - 1; i >= 0; i--) {
    const o = world.objects[i];
    if (Math.hypot(o.x - x, o.y - y) <= radiusOf(o)) return o;
  }
  return null;
}
