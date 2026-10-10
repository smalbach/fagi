// Trees: they drop fruit around their crown every so often.
// It's the only way food shows up without the player placing it.

import { TREE, POINT_TYPES, FORAGE, SEASONS, OBJECT_TYPES, MAPGEN } from './config.js';
import { addPoint, addObject, removeObject, record } from './world.js';
import { drawVariant } from './chemistry.js';
import { seasonNow } from './seasons.js';
import { weighFruit } from './load.js';
import { fruitRateOf } from './habitats.js';
import { isTree, isNest, radiusOf, waterZone } from './obstacles.js';

export function treesOf(world) {
  return world.objects.filter(isTree);
}

// How much of its fruit is still on the ground, so as not to fill the map.
// A tree set by hand (object-edit.js) keeps its own pace; one bearing a fruit
// the person made, that fruit's (custom-fruits.js); every other tree, the
// map's (TREE).
const fruitOf = (tree) => tree.fruit ?? TREE.fruit;
export const intervalOf = (tree) => tree.interval ?? POINT_TYPES[fruitOf(tree)]?.tree?.interval ?? TREE.interval;
export const maxNearOf = (tree) => tree.maxNear ?? POINT_TYPES[fruitOf(tree)]?.tree?.maxNear ?? TREE.maxNear;

function fruitNear(world, tree) {
  const scope = radiusOf(tree) * TREE.dropRadius + 20;
  let n = 0;
  for (const p of world.points) {
    if (p.type !== (tree.fruit ?? TREE.fruit)) continue;
    if (Math.hypot(p.x - tree.x, p.y - tree.y) <= scope) n++;
  }
  return n;
}

// A year whose fruit is far (or near) the nest (SEASONS.farYears): the trees
// on the other side of the middle distance bear only reachLow of their rate.
// The middle distance is worked out once, from the trees there are then.
function reachOf(world, tree, far) {
  if (far == null) return 1;
  const nest = world.objects.find((o) => o.type === 'nest');
  if (!nest) return 1;
  if (world.reachSplit == null) {
    const d = treesOf(world).map((t) => Math.hypot(t.x - nest.x, t.y - nest.y)).sort((a, b) => a - b);
    world.reachSplit = d[Math.floor(d.length / 2)] ?? 0;
  }
  const isFar = Math.hypot(tree.x - nest.x, tree.y - nest.y) >= world.reachSplit;
  return isFar === far ? 1 : SEASONS.reachLow;
}

export function updateTrees(world, dt) {
  // The time of year sets how fast every tree bears (SEASONS; 1 without them).
  const season = seasonNow();
  const bears = dt * season.fruit;
  if (TREE.seed) world.treeRoom ??= treesOf(world).length + TREE.room;
  for (const tree of treesOf(world)) {
    if (TREE.seed) ownTime(tree);
    // Trees have their time too: if TREE.life > 0, they dry up and fall.
    tree.age = (tree.age ?? 0) + dt;
    if (TREE.life > 0 && tree.age >= lifeOf(tree)) {
      removeObject(world, tree, 'died');
      if (TREE.seed) replace(world, tree);
      continue;
    }
    // A young tree grows; it bears once grown (TREE.seed).
    if (tree.full != null && grow(world, tree)) continue;

    // A seasonal tree gone bare drops nothing until its rest is over (FORAGE).
    if (FORAGE.enabled && seasonal(tree) && resting(world, tree, dt)) continue;

    tree.timer -= bears * reachOf(world, tree, season.far) * fruitRateOf(world, tree);   // its habitat's soil (HABITATS)
    if (tree.timer > 0) continue;
    // Its fruit was a made one the person has since deleted: it bears nothing.
    if (!POINT_TYPES[fruitOf(tree)]) { tree.timer = TREE.interval; continue; }
    tree.timer = intervalOf(tree);

    if (fruitNear(world, tree) >= maxNearOf(tree)) continue;

    // It falls at a random point in the crown, never at the center of the trunk.
    const r = radiusOf(tree);
    const ang = Math.random() * Math.PI * 2;
    const dist = r * 0.55 + Math.random() * (r * TREE.dropRadius - r * 0.55);
    const x = Math.min(world.width - 10, Math.max(10, tree.x + Math.cos(ang) * dist));
    const y = Math.min(world.height - 10, Math.max(10, tree.y + Math.sin(ang) * dist));
    // Fruit that falls in the water is carried off by it: nobody can pick it up.
    if (waterZone(world, x, y)) continue;
    const p = weighFruit(addPoint(world, x, y, tree.fruit ?? TREE.fruit, tree.id));
    const variant = drawVariant(p.type);   // a look-alike's fruit (TASTE), same look
    if (variant) p.variant = variant;
    tree.lastDrop = (tree.lastDrop ?? 0) + 1;
    if (FORAGE.enabled) spend(world, tree);
  }
}

// Seasons (FORAGE). Whether a tree bears all year is drawn the first time the
// tree is updated, from the world's own randomness: a tree placed later, by the
// map or by the person, gets its nature the same way.
function seasonal(tree) {
  tree.seasonal ??= Math.random() >= FORAGE.persistence;
  return tree.seasonal;
}

// One fruit less of this season's crop; the last one leaves it bare.
function spend(world, tree) {
  if (!seasonal(tree)) return;
  tree.crop = (tree.crop ?? FORAGE.crop) - 1;
  if (tree.crop > 0) return;
  tree.bare = FORAGE.rest;
  record(world, 'tree_bare', { id: tree.id });
}

// A bare tree rests; when its rest is over it bears a new crop.
function resting(world, tree, dt) {
  if (!(tree.bare > 0)) return false;
  tree.bare -= dt;
  if (tree.bare > 0) return true;
  tree.bare = 0;
  tree.crop = FORAGE.crop;
  record(world, 'tree_bears', { id: tree.id });
  return false;
}

// Is it bare right now (for drawing and the inspector)?
export const isBare = (tree) => tree.bare > 0;

// Changing the interval from the panel also affects the ones already placed.
export function setFruitInterval(world, seconds) {
  TREE.interval = seconds;
  for (const tree of treesOf(world)) tree.timer = Math.min(tree.timer, intervalOf(tree));
}

// How much of a tree's life has gone by, from 0 (just planted) to 1 (dry).
export function treeAge(tree) {
  if (TREE.life <= 0) return 0;
  return Math.min(1, (tree.age ?? 0) / lifeOf(tree));
}

// Its own lifespan (TREE.seed), or the map's.
export const lifeOf = (tree) => tree.life ?? TREE.life;

// Trees that come and go (TREE.seed). A tree of the map, the first time it is
// updated, gets a lifespan of its own and an age somewhere along it, so the
// map's trees do not all grow old together; a young one already has both.
function ownTime(tree) {
  if (TREE.life <= 0 || tree.life != null) return;
  tree.life = TREE.life * (0.7 + 0.6 * Math.random());
  tree.age ??= Math.random() * tree.life * 0.9;
}

// A young tree's crown grows from a third of its size; true while it is too
// young to bear.
function grow(world, tree) {
  const grown = Math.min(1, (tree.age ?? 0) / Math.max(1, TREE.mature));
  const r = Math.round(tree.full * (1 / 3 + (2 / 3) * grown));
  if (r !== tree.r) { tree.r = r; record(world, 'obj_resize', { id: tree.id, r }); }
  if (grown < 1) return true;
  delete tree.full;
  return false;
}

// Is there room for a tree to take root here: inside the map, off the water,
// clear of every crown (a seedling under one is shaded out) and of anything
// else on the map?
function roomAt(world, x, y) {
  const r = OBJECT_TYPES.tree.radius;
  const edge = (MAPGEN.margin ?? 0) + r;
  if (x < edge || y < edge || x > world.width - edge || y > world.height - edge) return false;
  if (waterZone(world, x, y)) return false;
  for (const o of world.objects) {
    const gap = isTree(o) || isNest(o) ? TREE.clear : (MAPGEN.minGap ?? 0);
    if (Math.hypot(o.x - x, o.y - y) < radiusOf(o) + r + gap) return false;
  }
  return true;
}

// A seedling: a third of a tree, with its own lifespan, bearing `fruit`.
function sprout(world, x, y, fruit) {
  const full = OBJECT_TYPES.tree.radius;
  const tree = addObject(world, x, y, 'tree', Math.round(full / 3));
  tree.full = full;
  tree.age = 0;
  tree.life = TREE.life > 0 ? TREE.life * (0.7 + 0.6 * Math.random()) : 0;
  if (fruit !== TREE.fruit) {
    tree.fruit = fruit;
    record(world, 'obj_fruit', { id: tree.id, what: fruit });
  }
  return tree;
}

// Where a seed ends up: up to TREE.spread px from where its fruit lay.
function scatter(x, y) {
  const a = Math.random() * Math.PI * 2;
  const d = Math.random() * TREE.spread;
  return { x: x + Math.cos(a) * d, y: y + Math.sin(a) * d };
}

// A fruit of a tree that rotted away where it lay, uncollected, leaves a seed
// (food.js). With room for it and for one more tree, it may take root at once;
// otherwise it lies dormant in the soil, waiting for a tree to die.
export function sowFrom(world, p) {
  if (!TREE.seed || typeof p.from !== 'number') return;
  const fruit = p.was ?? p.type;
  const { x, y } = scatter(p.x, p.y);
  if (!roomAt(world, x, y)) return;
  if (treesOf(world).length < (world.treeRoom ?? Infinity) && Math.random() < TREE.sprout) {
    sprout(world, x, y, fruit);
    return;
  }
  const bank = (world.seeds ??= []);
  bank.push({ x, y, fruit, at: world.time ?? 0 });
  while (bank.length > TREE.bank) bank.shift();
}

// A tree died: the oldest seed still alive in the soil, with room, takes its
// place in the wood; with none, a seed of its own, dropped near where it stood.
function replace(world, dead) {
  if (treesOf(world).length >= (world.treeRoom ?? Infinity)) return;
  const now = world.time ?? 0;
  const bank = (world.seeds ?? []).filter((s) => now - s.at < TREE.dormant);
  world.seeds = bank;
  while (bank.length) {
    const s = bank.shift();
    if (roomAt(world, s.x, s.y)) { sprout(world, s.x, s.y, s.fruit); return; }
  }
  for (let i = 0; i < 16; i++) {
    const { x, y } = scatter(dead.x, dead.y);
    if (roomAt(world, x, y)) { sprout(world, x, y, dead.fruit ?? TREE.fruit); return; }
  }
}

// Remove all the trees from the map at once.
export function removeAllTrees(world) {
  for (const tree of treesOf(world)) removeObject(world, tree, 'user');
}
