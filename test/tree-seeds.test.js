import test from 'node:test';
import assert from 'node:assert/strict';
import { TREE } from '../src/config.js';
import { createWorld, addObject, addPoint } from '../src/world.js';
import { updateTrees, sowFrom, sowNearNest, treesOf } from '../src/trees.js';

function withSeeds(fn) {
  const saved = { ...TREE };
  Object.assign(TREE, { seed: 1, life: 1000, sprout: 1, spread: 0, room: 1 });
  try { fn(); } finally { Object.assign(TREE, saved); }
}

test('a fruit rotted away far from every tree takes root, up to the room there is', () => withSeeds(() => {
  const w = createWorld();
  const tree = addObject(w, 200, 200, 'tree');
  updateTrees(w, 0.01);   // the map's trees are counted: room for one more
  sowFrom(w, { x: 200 + 60, y: 200, from: tree.id, type: 'toxic', was: 'nectar' });   // under its crown
  assert.equal(treesOf(w).length, 1);
  sowFrom(w, { x: 600, y: 500, from: tree.id, type: 'toxic', was: 'nectar' });
  assert.equal(treesOf(w).length, 2);
  const young = treesOf(w)[1];
  assert.ok(young.r < tree.r && young.full != null);
  sowFrom(w, { x: 900, y: 300, from: tree.id, type: 'toxic', was: 'nectar' });   // no room left: dormant
  assert.equal(treesOf(w).length, 2);
  assert.equal(w.seeds.length, 1);
}));

test('a dead tree is replaced by the oldest seed in the soil', () => withSeeds(() => {
  const w = createWorld();
  const tree = addObject(w, 200, 200, 'tree');
  TREE.room = 0;
  updateTrees(w, 0.01);
  sowFrom(w, { x: 700, y: 500, from: tree.id, type: 'toxic', was: 'nectar' });
  assert.equal(treesOf(w).length, 1);
  tree.age = tree.life;
  updateTrees(w, 0.01);
  const now = treesOf(w);
  assert.equal(now.length, 1);
  assert.deepEqual([now[0].x, now[0].y], [700, 500]);
}));

test('a fruit placed by hand leaves no seed', () => withSeeds(() => {
  const w = createWorld();
  addObject(w, 200, 200, 'tree');
  updateTrees(w, 0.01);
  sowFrom(w, addPoint(w, 700, 500, 'nectar', 'user'));
  assert.equal(treesOf(w).length, 1);
}));

test('an old tree leaves a seedling of its own beside it, which takes its place', () => withSeeds(() => {
  const w = createWorld();
  const tree = addObject(w, 400, 400, 'tree');
  Object.assign(TREE, { heirAt: 0.8, spread: 180 });
  updateTrees(w, 0.01);
  tree.age = tree.life * 0.85;
  // Where it lands is drawn; with no room it tries again a minute later.
  for (let i = 0; i < 20 && tree.heir == null; i++) { updateTrees(w, 0.01); tree.age += 61; }
  assert.ok(tree.heir != null);
  const heir = treesOf(w).find((t) => t.id === tree.heir);
  assert.ok(heir && heir.full != null && Math.hypot(heir.x - 400, heir.y - 400) <= 180);
  tree.age = tree.life;
  updateTrees(w, 0.01);
  assert.deepEqual(treesOf(w).map((t) => t.id), [heir.id]);
}));

test('a fruit stored at home leaves its seed near the nest', () => withSeeds(() => {
  const w = createWorld();
  addObject(w, 200, 200, 'tree');
  const nest = addObject(w, 700, 500, 'nest');
  Object.assign(TREE, { carried: 1, room: 1 });
  updateTrees(w, 0.01);
  // Where it lands is drawn; a few seeds, until one has room (TREE.sprout 1).
  for (let i = 0; i < 50 && !treesOf(w).some((t) => t.full != null); i++) sowNearNest(w, nest, 'nectar');
  const young = treesOf(w).find((t) => t.full != null);
  assert.ok(young);
  assert.ok(Math.hypot(young.x - nest.x, young.y - nest.y) <= 40 + 44 + TREE.clear + 180 + 1);
}));
