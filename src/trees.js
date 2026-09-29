// Trees: they drop fruit around their crown every so often.
// It's the only way food shows up without the player placing it.

import { TREE, POINT_TYPES } from './config.js';
import { addPoint, removeObject } from './world.js';
import { drawVariant } from './chemistry.js';
import { isTree, radiusOf, waterZone } from './obstacles.js';

export function treesOf(world) {
  return world.objects.filter(isTree);
}

// How much of its fruit is still on the ground, so as not to fill the map.
// A tree bearing a fruit the person made keeps that fruit's own pace
// (custom-fruits.js); every other tree, the map's (TREE).
const fruitOf = (tree) => tree.fruit ?? TREE.fruit;
export const intervalOf = (tree) => POINT_TYPES[fruitOf(tree)]?.tree?.interval ?? TREE.interval;
export const maxNearOf = (tree) => POINT_TYPES[fruitOf(tree)]?.tree?.maxNear ?? TREE.maxNear;

function fruitNear(world, tree) {
  const scope = radiusOf(tree) * TREE.dropRadius + 20;
  let n = 0;
  for (const p of world.points) {
    if (p.type !== (tree.fruit ?? TREE.fruit)) continue;
    if (Math.hypot(p.x - tree.x, p.y - tree.y) <= scope) n++;
  }
  return n;
}

export function updateTrees(world, dt) {
  for (const tree of treesOf(world)) {
    // Trees have their time too: if TREE.life > 0, they dry up and fall.
    tree.age = (tree.age ?? 0) + dt;
    if (TREE.life > 0 && tree.age >= TREE.life) {
      removeObject(world, tree, 'died');
      continue;
    }

    tree.timer -= dt;
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
    const p = addPoint(world, x, y, tree.fruit ?? TREE.fruit, tree.id);
    const variant = drawVariant(p.type);   // a look-alike's fruit (TASTE), same look
    if (variant) p.variant = variant;
    tree.lastDrop = (tree.lastDrop ?? 0) + 1;
  }
}

// Changing the interval from the panel also affects the ones already placed.
export function setFruitInterval(world, seconds) {
  TREE.interval = seconds;
  for (const tree of treesOf(world)) tree.timer = Math.min(tree.timer, intervalOf(tree));
}

// How much of a tree's life has gone by, from 0 (just planted) to 1 (dry).
export function treeAge(tree) {
  if (TREE.life <= 0) return 0;
  return Math.min(1, (tree.age ?? 0) / TREE.life);
}

// Remove all the trees from the map at once.
export function removeAllTrees(world) {
  for (const tree of treesOf(world)) removeObject(world, tree, 'user');
}
