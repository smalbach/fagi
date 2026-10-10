// World state: the food points and the map objects.

import { validAppearance } from './object-appearance.js';
import { WORLD, FAGI, NEST, OBJECT_TYPES, POINT_TYPES, TREE, MAPGEN } from './config.js';
import { createWind } from './wind.js';
import { createPheromone } from './pheromone.js';
import { createRain } from './rain.js';

export function createWorld() {
  return {
    width: WORLD.width, height: WORLD.height,
    points: [], objects: [],
    immersive: true,
    wind: createWind(),
    pheromone: createPheromone(),
    rain: createRain(),   // showers and puddles (rain.js)
    nextId: 1,   // every thing on the map carries an id: that way it can be named from outside
    time: 0,     // world clock in seconds; keeps running even if Fagi dies
    rec: null,   // the session recorder, if recording (recorder/)
  };
}

// Logs an event in the session recording, if there is one. Everything that changes
// the map goes through here: that way a game can be replayed without snapshots.
export function record(world, type, data) {
  world.rec?.emit(type, data);
}

// A new id per thing. It's never reused, not even when clearing the map: an
// API response arriving late can't mix up one fruit with another.
function newId(world) {
  world.nextId = (world.nextId ?? 1);
  return world.nextId++;
}

// `from` is who placed it: the id of the tree it fell from, or 'user'.
export function addPoint(world, x, y, type, from = null) {
  const p = { id: newId(world), x, y, type };
  if (from != null) p.from = from;   // the tree it fell from, or 'user' (the inspector shows it)
  world.points.push(p);
  record(world, 'point_add', { id: p.id, what: type, x, y, from });
  return p;
}

// `reason`: 'eaten', 'picked', 'rotted'...
export function removePoint(world, point, reason = 'removed') {
  const i = world.points.indexOf(point);
  if (i === -1) return;
  world.points.splice(i, 1);
  record(world, 'point_remove', { id: point.id, reason });
}

// Each object carries its own radius: that way it can be grown or shrunk later.
// `source`: 'map' (generated), 'user' (placed by hand) or 'sim'.
export function addObject(world, x, y, type, r = OBJECT_TYPES[type].radius, source = 'sim') {
  const obj = { id: newId(world), x, y, type, r };
  if (source === 'user') obj.seed = (Math.imul(obj.id, 2654435761) ^ (world.seed ?? 0)) >>> 0;
  if (OBJECT_TYPES[type].kind === 'nest') {
    obj.stock = {};   // how many rations there are of each thing
    obj.ages = {};    // and the age of each one, so they spoil too
  }
  if (OBJECT_TYPES[type].kind === 'spawner') obj.timer = TREE.interval; // fruit countdown
  world.objects.push(obj);
  record(world, 'obj_add', { id: obj.id, what: type, x, y, r, source, ...(obj.seed != null ? { seed: obj.seed } : {}) });
  return obj;
}

// Appearance changes are data, so recordings keep the chosen material/form.
export function setObjectAppearance(world, object, appearance) {
  if (!world.objects.includes(object) || !validAppearance(object.type, appearance)) return false;
  if ((object.appearance ?? 'auto') === appearance) return true;
  object.appearance = appearance;
  record(world, 'obj_appearance', { id: object.id, appearance });
  return true;
}

// The map's water source (there's only one). Rain puddles don't count.
export function waterSource(world) {
  return world.objects.find((o) => o.type === 'water') ?? null;
}

// The nest: home, pantry and the best place to rest. With more than one
// colony (COLONIES), each Fagi's is her own (fagi.home); without one given,
// or with a single nest, the first on the map.
export function nestOf(world, fagi = null) {
  if (fagi?.home != null) {
    const home = world.objects.find((o) => o.id === fagi.home);
    if (home) return home;
  }
  return world.objects.find((o) => OBJECT_TYPES[o.type].kind === 'nest') ?? null;
}

// Every nest on the map.
export const nestsOf = (world) => world.objects.filter((o) => OBJECT_TYPES[o.type].kind === 'nest');

// The two counts below work for ANY pantry: the nest's real one and
// the one Fagi remembers (fagi.pantry). That's why they work on a bare stock and
// not on the nest: whoever decides looks at her memory, not the world.
export function stockCount(stock) {
  return stock ? Object.values(stock).reduce((a, b) => a + b, 0) : 0;
}

// With the pantry this full, gathering more adds nothing: better to
// get to know the map.
export function stockFull(stock) {
  return stockCount(stock) >= NEST.full;
}

// How much is really stored in the nest. This is the world, not what Fagi
// knows: for the panel and for what happens while inside the nest.
export function nestStock(nestObj) {
  return nestObj ? stockCount(nestObj.stock) : 0;
}

export function nestFull(nestObj) {
  return Boolean(nestObj) && stockFull(nestObj.stock);
}

// The pantry keeps two ledgers: how much there is (stock) and the age of each ration
// (ages). They're written ONLY from here, and sync() reconciles them if someone
// touches the stock on their own, so they can't drift apart.
function sync(nestObj) {
  nestObj.ages ??= {};
  for (const type of Object.keys(nestObj.stock)) {
    const list = (nestObj.ages[type] ??= []);
    while (list.length < nestObj.stock[type]) list.push(0);
    while (list.length > nestObj.stock[type]) list.pop();
  }
}

// Store a ration. It goes in with the age it already had: the nest preserves it, it doesn't
// make it younger.
export function storeInNest(nestObj, type, age = 0) {
  sync(nestObj);
  nestObj.stock[type] = (nestObj.stock[type] ?? 0) + 1;
  (nestObj.ages[type] ??= []).push(age);
  return nestObj.stock[type];
}

// Serve a ration: the oldest one comes out, which is the one about to spoil.
export function takeFromNest(nestObj, type) {
  sync(nestObj);
  if (!nestObj.stock[type]) return false;
  nestObj.stock[type] -= 1;
  const list = nestObj.ages[type] ?? [];
  if (list.length) {
    let worst = 0;
    for (let i = 1; i < list.length; i++) if (list[i] > list[worst]) worst = i;
    list.splice(worst, 1);
  }
  return true;
}

// How far along the oldest ration of a type is, from 0 (just stored) to 1
// (about to spoil). For the panel.
export function nestRipeness(nestObj, type) {
  const life = (POINT_TYPES[type]?.life ?? 0) * NEST.keepFactor;
  if (life <= 0) return 0;
  const list = nestObj.ages?.[type] ?? [];
  return list.length ? Math.min(1, Math.max(...list) / life) : 0;
}

// Time runs in the pantry too, only NEST.keepFactor times more
// slowly. Once its life is up, the ration spoils and disappears.
export function updateNest(world, dt) {
  for (const nestObj of nestsOf(world)) spoilIn(world, nestObj, dt);
}

function spoilIn(world, nestObj, dt) {
  sync(nestObj);
  const step = dt / NEST.keepFactor;

  for (const [type, list] of Object.entries(nestObj.ages)) {
    const life = POINT_TYPES[type]?.life ?? 0;
    const remain = [];
    let losses = 0;
    for (const age of list) {
      const ageOf = age + step;
      if (life > 0 && ageOf >= life) { losses++; continue; }
      remain.push(ageOf);
    }
    nestObj.ages[type] = remain;
    if (!losses) continue;
    nestObj.stock[type] = Math.max(0, (nestObj.stock[type] ?? 0) - losses);
    nestObj.spoiled = (nestObj.spoiled ?? 0) + losses;
    nestObj.lastSpoiled = { type, n: losses, total: nestObj.spoiled };
    record(world, 'nest_spoil', { what: type, count: losses });
  }
}

export function removeObject(world, obj, source = 'sim') {
  const i = world.objects.indexOf(obj);
  if (i === -1) return;
  world.objects.splice(i, 1);
  record(world, 'obj_remove', { id: obj.id, source });
}

// New world for a new session: empty, with the clock and ids from zero
// and a different wind. It's the same object, so the camera and input keep
// pointing at it.
export function resetWorld(world) {
  clearWorld(world);
  sizeWorld(world);
  world.nextId = 1;
  world.time = 0;
  world.god = 0;      // edits by hand (godmode.js)
  world.day = null;   // the next step records day 1 again (simulation.js)
  world.rec = null;
  world.wind = createWind();
  world.rain = createRain();
}

// The map's size (MAPGEN.size × the base patch on each side). WORLD holds it
// too, because movement, exploring and map-making read it from there.
export function sizeWorld(world, size = MAPGEN.size) {
  const k = Math.max(1, size || 1);
  WORLD.width = Math.round(WORLD.baseWidth * k);
  WORLD.height = Math.round(WORLD.baseHeight * k);
  world.width = WORLD.width;
  world.height = WORLD.height;
}

export function clearWorld(world) {
  world.points.length = 0;
  world.objects.length = 0;
  world.pheromone.length = 0;
  world.mud = [];   // the mud belongs to the map that made it (mapgen.js)
  // New world, new terrain: the seed is the only thing that decides it.
  world.seed = null;
}

// The point Fagi is touching, or null. If she's touching the one she was chasing,
// that one wins: otherwise, two points stuck together hide each other and hers never
// makes it into her hands. Among the rest, the closest one.
export function pointTouching(world, fagi) {
  const scope = FAGI.eatRadius * FAGI.eatRadius;
  let best = null;
  let bestDist = Infinity;
  for (const p of world.points) {
    const dist = (p.x - fagi.x) ** 2 + (p.y - fagi.y) ** 2;
    if (dist > scope) continue;
    if (p === fagi.target) return p;
    if (dist < bestDist) { bestDist = dist; best = p; }
  }
  return best;
}
