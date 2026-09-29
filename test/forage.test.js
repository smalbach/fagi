import test from 'node:test';
import assert from 'node:assert/strict';

import { FORAGE, TREE } from '../src/config.js';
import { createWorld, addObject, nestOf } from '../src/world.js';
import { updateTrees, isBare } from '../src/trees.js';
import { updatePatches } from '../src/patches.js';
import { invalidEvent } from '../src/recorder/events.js';
import { rng, withRng } from '../scripts/batch/random.js';

// FORAGE on for one test, and back to how it was even if the test fails.
function withForage(fn) {
  const saved = { ...FORAGE };
  FORAGE.enabled = 1;
  try { fn(); } finally { Object.assign(FORAGE, saved); }
}

function orchard(seasonal) {
  const world = createWorld();
  world.rain.timer = Infinity;
  const tree = addObject(world, 300, 300, 'tree');
  tree.seasonal = seasonal;
  return { world, tree };
}

// Runs the trees for `seconds`, picking up every fruit as it falls so that
// TREE.maxNear never stops the tree. Returns how many fell.
function harvest(world, seconds, dt = 0.5) {
  let fell = 0;
  for (let t = 0; t < seconds; t += dt) {
    updateTrees(world, dt);
    fell += world.points.length;
    world.points.length = 0;
  }
  return fell;
}

test('with FORAGE on a seasonal tree drops its crop, goes bare, rests and bears again', () => withForage(() => {
  const { world, tree } = orchard(true);
  const fell = withRng(rng(3), () => harvest(world, TREE.interval * (FORAGE.crop + 4)));
  assert.equal(fell, FORAGE.crop, 'exactly one crop');
  assert.ok(isBare(tree));

  withRng(rng(4), () => harvest(world, FORAGE.rest - TREE.interval * 5));
  assert.ok(isBare(tree), 'still resting');
  const after = withRng(rng(5), () => harvest(world, TREE.interval * 12));
  assert.ok(after > 0, 'it bears again after its rest');
  assert.equal(isBare(tree), false);
}));

test('a tree that bears all year never goes bare', () => withForage(() => {
  const { world, tree } = orchard(false);
  const fell = withRng(rng(6), () => harvest(world, TREE.interval * (FORAGE.crop * 3)));
  assert.ok(fell > FORAGE.crop * 2, `${fell} fruit`);
  assert.equal(isBare(tree), false);
}));

test('persistence decides the share of trees that bear all year', () => withForage(() => {
  const kinds = (persistence) => {
    FORAGE.persistence = persistence;
    const world = createWorld();
    for (let i = 0; i < 40; i++) addObject(world, 100 + i * 20, 400, 'tree');
    withRng(rng(7), () => harvest(world, TREE.interval * 3));
    return world.objects.filter((o) => o.type === 'tree').map((o) => o.seasonal);
  };
  assert.ok(kinds(1).every((s) => s === false), 'all year');
  assert.ok(kinds(0).every((s) => s === true), 'all seasonal');
  const half = kinds(0.5).filter(Boolean).length;
  assert.ok(half > 8 && half < 32, `${half} of 40 seasonal`);
}));

test('with FORAGE off trees bear forever and no seasonal state is drawn', () => {
  const { world, tree } = orchard(undefined);
  delete tree.seasonal;
  const fell = withRng(rng(8), () => harvest(world, TREE.interval * (FORAGE.crop * 3)));
  assert.ok(fell > FORAGE.crop * 2);
  assert.equal(tree.seasonal, undefined);
  assert.equal(tree.crop, undefined);
});

test('a ground patch shows up now and then, away from the nest and out of the water', () => withForage(() => {
  const world = createWorld();
  addObject(world, 640, 430, 'nest');
  addObject(world, 300, 300, 'water', 60);
  const nest = nestOf(world);
  withRng(rng(9), () => {
    updatePatches(world, FORAGE.patchEvery - 1);
    assert.equal(world.points.length, 0, 'not yet');
    updatePatches(world, 1.5);
  });
  assert.ok(world.points.length > 0 && world.points.length <= FORAGE.patchSize, `${world.points.length} fruit`);
  for (const p of world.points) {
    assert.equal(p.from, 'patch');
    assert.ok(Math.hypot(p.x - nest.x, p.y - nest.y) >= FORAGE.patchMinNest - FORAGE.patchSpread);
  }
}));

test('with FORAGE off no patch ever shows up', () => {
  const world = createWorld();
  updatePatches(world, FORAGE.patchEvery * 10);
  assert.equal(world.points.length, 0);
  assert.equal(world.patchTimer, undefined);
});

test('the new events are valid for the recorder', () => {
  assert.equal(invalidEvent({ seq: 0, t: 1, type: 'tree_bare', id: 3 }), null);
  assert.equal(invalidEvent({ seq: 1, t: 2, type: 'tree_bears', id: 3 }), null);
  assert.equal(invalidEvent({ seq: 2, t: 3, type: 'patch', x: 1, y: 2, what: 'nectar', n: 6 }), null);
});
