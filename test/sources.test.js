import test from 'node:test';
import assert from 'node:assert/strict';

import { SOURCES } from '../src/config.js';
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
