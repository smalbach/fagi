// Sense of smell and scent trails.
//
// Each source gives off ONE scent thread that keeps growing over time: it heads
// downwind, but meanders, so it ends up crossing the map in
// different directions. Fagi smells it if she's near some segment of the thread, and
// smells it stronger the closer that segment is to the source.

import { specOf, FAGI, PLUME, WORLD, TREE, RAIN } from './config.js';
import { statMult } from './effects.js';
import { bodyMult } from './biology.js';
import { distanceTo, normalizeAngle } from './vision.js';
import { radiusOf, isTree, isWater } from './obstacles.js';
import { sameScent } from './percept.js';

// Fagi's total sensitivity applied to something's aroma.
export function aromaOf(fagi, key) {
  const aroma = specOf(key)?.aroma ?? 0;
  return aroma * FAGI.smell * statMult(fagi, 'smell') * bodyMult(fagi, 'smell');
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

// The box around a thread. Threads only grow or shorten at the tip, so the
// count and the tip node tell whether it is still the same thread.
const boxes = new WeakMap();
function boxOf(trail) {
  const nodes = trail.nodes;
  const tip = nodes[nodes.length - 1];
  const b = boxes.get(trail);
  if (b && b.n === nodes.length && b.tip === tip) return b;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of nodes) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const box = { n: nodes.length, tip, minX, maxX, minY, maxY };
  boxes.set(trail, box);
  return box;
}

// Intensity arriving from ONE specific source. Keeping this calculation separate
// avoids attributing the plume of a single fruit to all fruits of the same type.
export function scentFromSourceAt(fagi, source, x, y) {
  const sens = FAGI.smell * statMult(fagi, 'smell') * bodyMult(fagi, 'smell');
  const r = PLUME.radius * sens;
  const r2 = r * r;
  const { src, extra = 0 } = source;
  if (!src.trail) return 0;

  // Right next to the source itself she just smells it, wherever she comes from.
  if (distanceTo({ x, y }, src) - extra <= r) return 1;

  // Far outside the box around the whole thread, no node reaches her (only a
  // shortcut: what passes is what the loop below would find anyway).
  const nodes = src.trail.nodes;
  const bb = boxOf(src.trail);
  const m = r + 1e-6;
  if (x < bb.minX - m || x > bb.maxX + m || y < bb.minY - m || y > bb.maxY + m) return 0;

  for (let i = 0; i < nodes.length; i++) {
    const dx = nodes[i].x - x;
    const dy = nodes[i].y - y;
    if (dx * dx + dy * dy > r2) continue;
    // The farther the segment is from the source, the more diluted the smell:
    // the first node that reaches her, the nearest to the source, is the
    // strongest.
    return 1 - (i / nodes.length) * PLUME.faint;
  }
  return 0;
}

// Aggregate intensity of a TYPE. Tracking uses the combined gradient because
// Fagi recognizes the smell, but doesn't know the identity of its source from a distance.
export function scentAt(fagi, world, key, x, y) {
  let max = 0;
  for (const source of scentSources(world)) {
    // She follows a smell, not a species (percept.js): the same thing without PERCEPT.
    if (!sameScent(source.key, key)) continue;
    max = Math.max(max, scentFromSourceAt(fagi, source, x, y));
  }
  return max;
}

// How far from a source or its thread she can smell it.
const smellReach = (fagi) => PLUME.radius * FAGI.smell * statMult(fagi, 'smell') * bodyMult(fagi, 'smell');

// Where every smell is, by area: each food point, pool and tree sits in every
// cell of a grid (CELL px) its thread's box, or its own circle, touches. Threads
// only change in stepWorld (updateTrails), before the Fagis move, and a point
// added since has no thread yet (it smells of nothing until the next step), so
// rebuilt each step, and when a point or object is added or removed, it is
// exact: a query returns every source that could reach her, in scentSources
// order, and the caller works each one out as it always did.
const CELL = 128;
const scentGrids = new WeakMap();
function scentGridOf(world) {
  let g = scentGrids.get(world);
  if (g && g.time === world.time && g.points === world.points && g.pv === (world.pointsVersion ?? 0) && g.ov === (world.objectsVersion ?? 0)
    && g.np === world.points.length && g.no === world.objects.length) return g;
  const all = [...world.points, ...world.objects.filter((o) => isWater(o) || isTree(o))];
  const cells = new Map();
  all.forEach((src, i) => {
    const extra = i < world.points.length ? 0 : radiusOf(src);
    let minX = src.x - extra, maxX = src.x + extra, minY = src.y - extra, maxY = src.y + extra;
    if (src.trail?.nodes?.length) {
      const b = boxOf(src.trail);
      minX = Math.min(minX, b.minX); maxX = Math.max(maxX, b.maxX); minY = Math.min(minY, b.minY); maxY = Math.max(maxY, b.maxY);
    }
    for (let cx = Math.floor(minX / CELL); cx <= Math.floor(maxX / CELL); cx++) {
      for (let cy = Math.floor(minY / CELL); cy <= Math.floor(maxY / CELL); cy++) {
        const k = cx * 100003 + cy;
        let list = cells.get(k);
        if (!list) cells.set(k, list = []);
        list.push(i);
      }
    }
  });
  g = { time: world.time, points: world.points, pv: world.pointsVersion ?? 0, ov: world.objectsVersion ?? 0, np: world.points.length, no: world.objects.length, all, cells, npts: world.points.length, stamp: new Uint32Array(all.length), mark: 0 };
  scentGrids.set(world, g);
  return g;
}

// The sources that may reach anywhere in [x0, x1] × [y0, y1] widened by
// `reach`: food points first, then pools and trees, each in its list's order.
function sourcesNear(world, x0, y0, x1, y1, reach) {
  const g = scentGridOf(world);
  if (++g.mark === 0xffffffff) { g.stamp.fill(0); g.mark = 1; }
  const found = [];
  for (let cx = Math.floor((x0 - reach) / CELL); cx <= Math.floor((x1 + reach) / CELL); cx++) {
    for (let cy = Math.floor((y0 - reach) / CELL); cy <= Math.floor((y1 + reach) / CELL); cy++) {
      const list = g.cells.get(cx * 100003 + cy);
      if (!list) continue;
      for (const i of list) if (g.stamp[i] !== g.mark) { g.stamp[i] = g.mark; found.push(i); }
    }
  }
  found.sort((a, b) => a - b);
  return { points: found.filter((i) => i < g.npts).map((i) => g.all[i]), objects: found.filter((i) => i >= g.npts).map((i) => g.all[i]) };
}

// scentAt for several spots at once (tracking samples six around her, within
// FAGI.probe): only the sources of that smell that may reach those spots are
// gathered, once. Same numbers.
export function scentField(fagi, world, key) {
  const near = sourcesNear(world, fagi.x - FAGI.probe, fagi.y - FAGI.probe, fagi.x + FAGI.probe, fagi.y + FAGI.probe, smellReach(fagi) + 1);
  const sources = [
    ...near.points.map((p) => ({ src: p, key: p.type, extra: 0 })),
    ...near.objects.map((o) => (isWater(o) ? { src: o, key: o.type, extra: radiusOf(o) } : { src: o, key: o.fruit ?? TREE.fruit, extra: radiusOf(o) })),
  ].filter(({ key: k }) => (specOf(k)?.aroma ?? 0) > 0 && sameScent(k, key));
  return (x, y) => {
    let max = 0;
    for (const source of sources) max = Math.max(max, scentFromSourceAt(fagi, source, x, y));
    return max;
  };
}

// Which food points reach her through smell right now.
export function smelledPoints(fagi, world) {
  const out = [];
  for (const p of sourcesNear(world, fagi.x, fagi.y, fagi.x, fagi.y, smellReach(fagi) + 1).points) {
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
  const source = obj && world.objects.includes(obj) ? sourceOfObject(obj) : scentSources(world).find(({ src }) => src === obj);
  return source ? scentFromSourceAt(fagi, source, fagi.x, fagi.y) : 0;
}

// The pools and trees whose smell may reach her where she is, in
// world.objects order (perception.js walks the trees).
export const objectsSmelledNear = (fagi, world) => sourcesNear(world, fagi.x, fagi.y, fagi.x, fagi.y, smellReach(fagi) + 1).objects;

// The same for an object known to be on the map (`world.objects` is being
// walked): no need to look for it there.
export function scentOfPresent(fagi, obj) {
  const source = sourceOfObject(obj);
  return source ? scentFromSourceAt(fagi, source, fagi.x, fagi.y) : 0;
}

// The entry scentSources(world) would have for a pool or tree on the map,
// without building the whole list (it is asked for every tree, by every Fagi,
// every step); null for anything else.
function sourceOfObject(obj) {
  let source;
  if (isWater(obj)) source = { src: obj, key: obj.type, extra: radiusOf(obj) };
  else if (isTree(obj)) source = { src: obj, key: obj.fruit ?? TREE.fruit, extra: radiusOf(obj) };
  else return null;
  return (specOf(source.key)?.aroma ?? 0) > 0 ? source : null;
}
