// Sense of smell and scent trails.
//
// Each source gives off ONE scent thread that keeps growing over time: it heads
// downwind, but meanders, so it ends up crossing the map in
// different directions. Fagi smells it if she's near some segment of the thread, and
// smells it stronger the closer that segment is to the source.

import { specOf, FAGI, PLUME, WORLD, TREE, RAIN } from './config.js';
import { statMult } from './effects.js';
import { distanceTo, normalizeAngle } from './vision.js';
import { radiusOf, isTree, isWater } from './obstacles.js';

// Fagi's total sensitivity applied to something's aroma.
export function aromaOf(fagi, key) {
  const aroma = specOf(key)?.aroma ?? 0;
  return aroma * FAGI.smell * statMult(fagi, 'smell');
}

function maxNodes(key) {
  return Math.round((specOf(key)?.aroma ?? 0) * PLUME.nodesPerAroma);
}

function ensureTrail(src, wind) {
  // If the source has moved, its old trail is no longer valid: the smell comes from
  // where it is now, so the thread is rebuilt from scratch.
  const t = src.trail;
  if (t && t.originX === src.x && t.originY === src.y) {
    // If the source changed type (a fruit that rotted), the trail is still
    // there but it's a different smell now: it keeps the length the new one allows.
    if (t.type !== src.type) {
      t.type = src.type;
      const cap = maxNodes(src.type);
      if (t.nodes.length > cap) t.nodes.length = Math.max(1, cap);
    }
    return t;
  }

  src.trail = {
    nodes: [{ x: src.x, y: src.y }],
    dir: wind.angle,
    timer: 0,
    originX: src.x,
    originY: src.y,
    type: src.type,
  };
  return src.trail;
}

// Lengthens a thread: each segment bends a bit on its own and the wind
// keeps straightening it. It bounces off the edges of the map.
function grow(src, key, wind, dt) {
  const trail = ensureTrail(src, wind);
  const cap = maxNodes(key);

  trail.timer -= dt;
  let guard = 0;
  while (trail.timer <= 0 && trail.nodes.length < cap && guard++ < 20) {
    const towardWind = normalizeAngle(wind.angle - trail.dir);
    trail.dir = normalizeAngle(
      trail.dir + (Math.random() - 0.5) * PLUME.drift + towardWind * PLUME.windPull
    );

    const last = trail.nodes[trail.nodes.length - 1];
    let x = last.x + Math.cos(trail.dir) * PLUME.step;
    let y = last.y + Math.sin(trail.dir) * PLUME.step;

    if (x < 0 || x > WORLD.width) { trail.dir = normalizeAngle(Math.PI - trail.dir); x = last.x; }
    if (y < 0 || y > WORLD.height) { trail.dir = normalizeAngle(-trail.dir); y = last.y; }

    trail.nodes.push({ x, y });
    trail.timer += PLUME.every;
  }
}

// All the sources that smell: food points and pools.
export function scentSources(world) {
  const out = world.points.map((p) => ({ src: p, key: p.type, extra: 0 }));
  for (const o of world.objects) {
    if (isWater(o)) out.push({ src: o, key: o.type, extra: radiusOf(o) });
    // The tree announces the kind of fruit it produces; the exact direction is
    // followed by gradient, without magically revealing where it is.
    else if (isTree(o)) out.push({ src: o, key: o.fruit ?? TREE.fruit, extra: radiusOf(o) });
  }
  return out.filter(({ key }) => (specOf(key)?.aroma ?? 0) > 0);
}

// Rain carries the smell away: the thread shortens from the tip until only the
// source is left, in RAIN.washScent seconds if it was whole. While it falls it doesn't
// grow; when it clears grow() lays it out again from the source.
function wash(src, key, dt) {
  const trail = src.trail;
  if (!trail || trail.nodes.length <= 1) return;
  trail.washed = (trail.washed ?? 0) + dt * maxNodes(key) / Math.max(0.1, RAIN.washScent);
  const remove = Math.floor(trail.washed);
  trail.washed -= remove;
  trail.nodes.length = Math.max(1, trail.nodes.length - remove);
  trail.timer = Math.max(trail.timer, 0);
}

// Grows (or washes, if it's raining) every thread on the map. Once per frame.
export function updateTrails(world, dt) {
  const rains = world.rain?.on;
  for (const { src, key } of scentSources(world)) {
    if (rains) wash(src, key, dt);
    else grow(src, key, world.wind, dt);
  }
}

// Intensity arriving from ONE specific source. Keeping this calculation separate
// avoids attributing the plume of a single fruit to all fruits of the same type.
export function scentFromSourceAt(fagi, source, x, y) {
  const sens = FAGI.smell * statMult(fagi, 'smell');
  const r = PLUME.radius * sens;
  const r2 = r * r;
  const { src, extra = 0 } = source;
  if (!src.trail) return 0;

  // Right next to the source itself she just smells it, wherever she comes from.
  if (distanceTo({ x, y }, src) - extra <= r) return 1;

  let max = 0;
  const nodes = src.trail.nodes;
  for (let i = 0; i < nodes.length; i++) {
    const dx = nodes[i].x - x;
    const dy = nodes[i].y - y;
    if (dx * dx + dy * dy > r2) continue;
    // The farther the segment is from the source, the more diluted the smell.
    const force = 1 - (i / nodes.length) * PLUME.faint;
    if (force > max) max = force;
  }
  return max;
}

// Aggregate intensity of a TYPE. Tracking uses the combined gradient because
// Fagi recognizes the smell, but doesn't know the identity of its source from a distance.
export function scentAt(fagi, world, key, x, y) {
  let max = 0;
  for (const source of scentSources(world)) {
    if (source.key !== key) continue;
    max = Math.max(max, scentFromSourceAt(fagi, source, x, y));
  }
  return max;
}

// Which food points reach her through smell right now.
export function smelledPoints(fagi, world) {
  const out = [];
  for (const p of world.points) {
    const force = scentFromSourceAt(fagi, { src: p, extra: 0 }, fagi.x, fagi.y);
    if (force > 0) out.push({ point: p, dist: distanceTo(fagi, p), force });
  }
  return out;
}

// Does the smell of this pool reach her?
export function smellsObject(fagi, obj, world) {
  return scentStrengthOfObject(fagi, obj, world) > 0;
}

export function scentStrengthOfObject(fagi, obj, world) {
  const source = scentSources(world).find(({ src }) => src === obj);
  return source ? scentFromSourceAt(fagi, source, fagi.x, fagi.y) : 0;
}
