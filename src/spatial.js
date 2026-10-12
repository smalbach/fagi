// Where the map's objects are, by area (a grid of CELL px), and who each id
// is: so a Fagi asks only about what is near her, not about every tree and
// rock on the map. On a big map (GROWTH, MAPGEN.size) that is most of the cost
// of a step; on the base map it changes nothing.
//
// Exact by construction: a query returns every object that could pass the
// caller's own test (each object sits in every cell its circle, fattened by
// PAD, touches), in world.objects order, and the caller runs the same test it
// always ran. So walking the answer gives the same result as walking
// world.objects.
//
// The grid is rebuilt when the map changes: an object added or removed
// (world.objectsVersion, world.js), the list replaced or grown, or the clock
// moved (rain puddles and young trees change size within a step; PAD covers
// that much growth until the next one).

import { radiusOf, isNest } from './obstacles.js';

const CELL = 128;
const PAD = 32;

const grids = new WeakMap();

function gridOf(world) {
  const objects = world.objects;
  let g = grids.get(world);
  if (g && g.objects === objects && g.len === objects.length && g.version === (world.objectsVersion ?? 0) && g.time === world.time) return g;
  const cells = new Map();
  const byId = new Map();
  let maxR = 0;
  const nests = [];
  for (let i = 0; i < objects.length; i++) {
    const o = objects[i];
    byId.set(o.id, o);
    if (isNest(o)) nests.push(o);
    const r = radiusOf(o) + PAD;
    if (r > maxR) maxR = r;
    const x0 = Math.floor((o.x - r) / CELL), x1 = Math.floor((o.x + r) / CELL);
    const y0 = Math.floor((o.y - r) / CELL), y1 = Math.floor((o.y + r) / CELL);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const key = cx * 100003 + cy;
        let list = cells.get(key);
        if (!list) cells.set(key, list = []);
        list.push(i);
      }
    }
  }
  g = { objects, len: objects.length, version: world.objectsVersion ?? 0, time: world.time, cells, byId, maxR, stamp: new Uint32Array(objects.length), mark: 0, nests };
  grids.set(world, g);
  return g;
}

// Every object whose circle may touch the box [x0, x1] × [y0, y1], in
// world.objects order.
export function objectsIn(world, x0, y0, x1, y1) {
  const g = gridOf(world);
  const objects = g.objects;
  if (++g.mark === 0xffffffff) { g.stamp.fill(0); g.mark = 1; }
  const found = [];
  const cx0 = Math.floor(Math.min(x0, x1) / CELL), cx1 = Math.floor(Math.max(x0, x1) / CELL);
  const cy0 = Math.floor(Math.min(y0, y1) / CELL), cy1 = Math.floor(Math.max(y0, y1) / CELL);
  for (let cx = cx0; cx <= cx1; cx++) {
    for (let cy = cy0; cy <= cy1; cy++) {
      const list = g.cells.get(cx * 100003 + cy);
      if (!list) continue;
      for (const i of list) {
        if (g.stamp[i] === g.mark) continue;
        g.stamp[i] = g.mark;
        found.push(i);
      }
    }
  }
  found.sort((a, b) => a - b);
  return found.map((i) => objects[i]);
}

// Every object whose circle may come within `reach` of (x, y).
export const objectsNear = (world, x, y, reach) => objectsIn(world, x - reach, y - reach, x + reach, y + reach);

// The largest radius on the map (with PAD): how far a push off one object can
// carry her (pushOutOfBlocks).
export const largestRadius = (world) => gridOf(world).maxR;

// Every nest on the map, in world.objects order (a new list each time).
export const nestsIn = (world) => gridOf(world).nests.slice();

// The object with this id, or undefined.
export const objectById = (world, id) => gridOf(world).byId.get(id);
