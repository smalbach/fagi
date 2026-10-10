import test from 'node:test';
import assert from 'node:assert/strict';

import { SOURCES, TREE } from '../src/config.js';
import { createWorld, addObject, addPoint } from '../src/world.js';
import { createFagi } from '../src/fagi.js';
import { perceive } from '../src/perception.js';

function scene() {
  const world = createWorld();
  world.rain.timer = Infinity;
  const fagi = createFagi();
  fagi.angle = 0;
  fagi.hunger = 60;
  const tree = addObject(world, fagi.x + 150, fagi.y, 'tree');
  tree.fruit = 'nectar';
  return { world, fagi, tree };
}

test('with SOURCES off a tree is a food source from birth', () => {
  const { world, fagi, tree } = scene();
  const ctx = perceive(fagi, world);
  assert.equal(ctx.visibleSource, tree);
});

test('with SOURCES on a tree is just a big object until she sees fruit lying around it', () => {
  SOURCES.enabled = 1;
  const { world, fagi, tree } = scene();
  assert.equal(perceive(fagi, world).visibleSource, null);
  addPoint(world, tree.x - 60, tree.y, 'nectar', tree.id);
  perceive(fagi, world);
  assert.equal(fagi.brain.sources[tree.id].fruit, 'nectar');
  world.points.length = 0;
  assert.equal(perceive(fagi, world).visibleSource, tree, 'she remembers it once the fruit is gone');
  SOURCES.enabled = 0;
});

// Walking in circles (2026-10-09): a bare tree used to stay a source, so up at
// its crown she lost it, turned back for it and circled.
test('with SOURCES.bare a tree she finds bare stops pulling her until a fruit could fall again', () => {
  SOURCES.bare = 1;
  const { world, fagi, tree } = scene();
  assert.equal(perceive(fagi, world).visibleSource, tree, 'from afar it is a source');
  fagi.x = tree.x - 50;   // up at the crown, nothing under it
  perceive(fagi, world);
  fagi.x = tree.x - 150;
  assert.equal(perceive(fagi, world).visibleSource, null, 'just found bare: not a source');
  fagi.age += TREE.interval;
  assert.equal(perceive(fagi, world).visibleSource, tree, 'a fruit could have fallen since');
  SOURCES.bare = 0;
});

test('with SOURCES.bare seeing fruit under a bare tree makes it a source again', () => {
  SOURCES.bare = 1;
  const { world, fagi, tree } = scene();
  fagi.x = tree.x - 50;
  perceive(fagi, world);
  fagi.x = tree.x - 150;
  addPoint(world, tree.x - 60, tree.y, 'nectar', tree.id);
  assert.equal(perceive(fagi, world).visibleSource, tree);
  SOURCES.bare = 0;
});

// Waiting under a tree (2026-10-09): leaving a bare tree (SOURCES.bare) cost the
// born program most of its survival in the research world; she waits instead.
test('with SOURCES.wait, hungry under a bare tree she knows, she waits there standing', async () => {
  const { exploreRule } = await import('../src/decision/explore.js');
  SOURCES.wait = 1;
  const { world, fagi, tree } = scene();
  perceive(fagi, world);
  fagi.x = tree.x - 50;
  const ctx = perceive(fagi, world);
  assert.equal(ctx.waitAt, tree);
  assert.equal(exploreRule(fagi, world, ctx).action, 'wait');
  SOURCES.wait = 0;
});

test('with SOURCES.wait she gives up after patience, and the tree is bare to her', () => {
  SOURCES.wait = 1;
  SOURCES.patience = 30;
  const { world, fagi, tree } = scene();
  perceive(fagi, world);
  fagi.x = tree.x - 50;
  assert.equal(perceive(fagi, world).waitAt, tree);
  fagi.age += 29;
  assert.equal(perceive(fagi, world).waitAt, tree, 'still waiting');
  fagi.age += 2;
  assert.equal(perceive(fagi, world).waitAt, null, 'gave up');
  fagi.x = tree.x - 150;
  assert.equal(perceive(fagi, world).visibleSource, null, 'bare to her now');
  SOURCES.wait = 0;
  SOURCES.patience = null;
});
