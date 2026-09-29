// Things: small objects with no inborn category (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md §12.8).
//
// A fruit she knows is food from birth; what she learns is which fruit. A
// thing she knows nothing about: she only sees how it looks (a color, a shape
// and a texture) and what it is good for she has to find out. Each map hangs
// what things do on one of those traits, drawn per map, the way the smell
// decides what a fruit does (chemistry.js):
//   sap    nibbling it takes thirst away (and leaves it dry for a while)
//   cool   pressed against it, her body cools
//   warm   pressed against it, her body warms
//   sting  touching or biting it hurts
//   inert  nothing
// What she feels (cold or warm to the touch, pain, thirst easing) are inborn
// senses. What the thing affords is not: concepts.js learns it.
//
// Nothing here decides anything: it places the things and says what happens
// when she touches or nibbles one. With CONCEPT off no thing is ever placed.

import { CONCEPT, THIRST, OBJECT_TYPES, FAGI, MAPGEN, WORLD, HEALTH } from './config.js';
import { COLOR_HEX } from './chemistry.js';
import { addObject, removeObject, record, nestOf } from './world.js';
import { radiusOf } from './obstacles.js';
import { hurt } from './health.js';

export const THING_TRAITS = {
  color: Object.keys(COLOR_HEX),
  shape: ['stone', 'pod', 'tuft', 'shell'],
  texture: ['smooth', 'rough', 'spiny', 'soft'],
};
export const AFFORDANCES = ['sap', 'cool', 'warm', 'sting', 'inert'];
// What she feels, by touch or by mouth, from each: the senses she is born with.
export const TOUCH = { sap: 'nothing', cool: 'cold', warm: 'warm', sting: 'pain', inert: 'nothing' };
export const MOUTH = { sap: 'sap', cool: 'nothing', warm: 'nothing', sting: 'pain', inert: 'nothing' };

export const isThing = (o) => OBJECT_TYPES[o?.type]?.kind === 'thing';
export const lookKey = ({ color, shape, texture }) => `${color}-${shape}-${texture}`;
export const cuesOfLook = (look) => Object.entries(look).map(([d, v]) => `${d}:${v}`);

const shuffle = (list, rnd) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// The chemistry of things on one map: which trait decides, and what each of
// its values affords. Sap and sting are always there; two of cool, warm and
// inert take the other values. Values beyond the fifth (colors) are inert.
export function createThingChemistry(rnd = Math.random, dims = CONCEPT.dims) {
  const dim = dims[Math.floor(rnd() * dims.length)];
  const values = shuffle(THING_TRAITS[dim], rnd);
  const affs = ['sap', 'sting', ...shuffle(['cool', 'warm', 'inert'], rnd)];
  const aff = {};
  values.forEach((v, i) => { aff[v] = i < 4 ? affs[i] : 'inert'; });
  return { dim, aff, values: values.slice(0, 4) };
}

export function affordanceOf(chem, look) {
  return chem?.aff[look[chem.dim]] ?? 'inert';
}

// The kinds on a map: spread over the four deciding values that afford
// something, so each affordance has several kinds; the other traits at random,
// every look different.
export function drawKinds(chem, n, rnd = Math.random, taken = new Set()) {
  const kinds = [];
  const seen = new Set(taken);
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  for (let i = 0, tries = 0; kinds.length < n && tries < n * 50; tries++) {
    const look = {};
    for (const d of Object.keys(THING_TRAITS)) look[d] = pick(THING_TRAITS[d]);
    look[chem.dim] = chem.values[i % chem.values.length];
    const key = lookKey(look);
    if (seen.has(key)) continue;
    seen.add(key);
    kinds.push(look);
    i++;
  }
  return kinds;
}

// Somewhere free on the map. Things are small and may lie closer together
// than the big objects; never on the spot where Fagi spawns.
function placeThing(world) {
  const r = OBJECT_TYPES.thing.radius;
  const cx = WORLD.width / 2;
  const cy = WORLD.height / 2;
  for (let attempt = 0; attempt < 60; attempt++) {
    const x = MAPGEN.margin + r + Math.random() * (WORLD.width - 2 * (MAPGEN.margin + r));
    const y = MAPGEN.margin + r + Math.random() * (WORLD.height - 2 * (MAPGEN.margin + r));
    if (Math.hypot(x - cx, y - cy) < MAPGEN.spawnClear) continue;
    if (world.objects.some((o) => Math.hypot(o.x - x, o.y - y) < r + radiusOf(o) + 14)) continue;
    return addObject(world, x, y, 'thing', r, 'map');
  }
  return null;
}

function scatter(world, kinds, count) {
  for (let i = 0; i < Math.max(count, kinds.length); i++) {
    const obj = placeThing(world);
    if (obj) setLook(world, obj, kinds[i % kinds.length]);
  }
}

// Scatters the things over the map (mapgen.js, last, so nothing else moves).
export function placeThings(world) {
  const chem = createThingChemistry();
  world.thingChemistry = chem;
  const kinds = drawKinds(chem, CONCEPT.kinds);
  world.thingKinds = kinds.map(lookKey);
  // A bigger map keeps the same things per square pixel.
  const area = Math.max(1, (world.width * world.height) / (WORLD.baseWidth * WORLD.baseHeight));
  scatter(world, kinds, Math.round(CONCEPT.things * area));
}

// Later in her life new kinds sprout (CONCEPT.lateAt): looks never on the map
// before, over the same deciding values. What she makes of them before she
// touches them is what her concepts are worth.
export function sproutThings(world) {
  if (!CONCEPT.lateKinds || world.lateKinds || !world.thingChemistry || world.time < CONCEPT.lateAt) return;
  const kinds = drawKinds(world.thingChemistry, CONCEPT.lateKinds, Math.random, new Set(world.thingKinds));
  world.lateKinds = kinds.map(lookKey);
  scatter(world, kinds, CONCEPT.lateThings);
}

export function setLook(world, obj, look) {
  obj.look = { ...look };
  obj.key = lookKey(look);
  obj.dryUntil = 0;
  record(world, 'obj_look', { id: obj.id, look: obj.look });
}

// A thing placed by hand or by the world outside mapgen.
export function addThing(world, x, y, look) {
  const obj = addObject(world, x, y, 'thing', undefined, 'sim');
  setLook(world, obj, look);
  return obj;
}

// Dry: a sap thing she drained. She can see it (it looks withered).
export const isDry = (world, obj) => (obj.dryUntil ?? 0) > world.time;

// Is she touching it?
export function touching(fagi, obj) {
  return Math.hypot(obj.x - fagi.x, obj.y - fagi.y) <= radiusOf(obj) + FAGI.radius + CONCEPT.reach;
}

// The thing she is pressed against right now, if any (thermal.js).
export function pressedTo(fagi, world) {
  if (!CONCEPT.enabled) return null;
  return world.objects.find((o) => isThing(o) && touching(fagi, o)) ?? null;
}

// °C a thing she is pressed against adds to where her body is heading.
export function thermalOfContact(fagi, world) {
  const obj = pressedTo(fagi, world);
  if (!obj) return 0;
  const aff = affordanceOf(world.thingChemistry, obj.look);
  return aff === 'cool' ? -CONCEPT.thermal : aff === 'warm' ? CONCEPT.thermal : 0;
}

// What a touch or a nibble does to her body, and what she feels:
// 'cold' | 'warm' | 'pain' | 'sap' | 'nothing'. A dry thing gives nothing to
// the mouth, and she knows why (she sees it is dry).
export function contact(fagi, world, obj, act) {
  const aff = affordanceOf(world.thingChemistry, obj.look);
  const felt = act === 'touch' ? TOUCH[aff] : MOUTH[aff];
  if (felt === 'pain') {
    fagi.energy = Math.max(0, fagi.energy - CONCEPT.sting);
    hurt(fagi, HEALTH.sting, 'sting');
  } else if (felt === 'sap') {
    if (isDry(world, obj)) return 'dry';
    fagi.thirst = Math.max(0, fagi.thirst - CONCEPT.sap);
    obj.dryUntil = world.time + CONCEPT.sapRegrow;
  }
  return felt;
}

// Thirst it would take away, for whoever weighs it (THIRST.max units).
export const sapRelief = () => CONCEPT.sap / THIRST.max;

// --- combining: lining the nest -----------------------------------------------
// A thing carried into the nest stays there and changes it: a warm one warms
// it, a cool one cools it (like the materials birds line a nest with). That is
// an affordance of the pair, not of the thing alone.

// She picks it up: it leaves the map and goes with her.
export function haul(fagi, world, obj) {
  removeObject(world, obj, 'hauled');
  fagi.hauling = { id: obj.id, key: obj.key, look: { ...obj.look } };
}

// Inside the nest she lays it down among the others.
export function lineNest(fagi, world, nest) {
  const item = fagi.hauling;
  (nest.lining ??= []).push(item);
  record(world, 'nest_line', { id: item.id, look: item.look });
  fagi.hauling = null;
  fagi.lastLining = { n: (fagi.lastLining?.n ?? 0) + 1, key: item.key, count: nest.lining.length };
}

// °C the nest's lining adds to its temperature.
export function nestWarmth(world) {
  if (!CONCEPT.enabled) return 0;
  const nest = nestOf(world);
  let heat = 0;
  for (const item of nest?.lining ?? []) {
    const aff = affordanceOf(world.thingChemistry, item.look);
    if (aff === 'warm') heat += CONCEPT.liningHeat;
    else if (aff === 'cool') heat -= CONCEPT.liningHeat;
  }
  return heat;
}

