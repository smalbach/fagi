import test from 'node:test';
import assert from 'node:assert/strict';

import { PHERO, PLUME, TREE } from '../src/config.js';
import { createWorld, addObject } from '../src/world.js';
import { createFagi } from '../src/fagi.js';
import { perceive } from '../src/perception.js';
import { followPheromone } from '../src/pheromone.js';
import { trackScent } from '../src/movement.js';
import { updateTrails } from '../src/smell.js';

// Walking in circles (2026-10-09). The bare tree is in sources.test.js.

// Her own trail: the next mark could lie behind her or closer than her
// turning radius, and she orbited it.
const marks = { objects: [], pheromone: [{ x: 92, y: 100, dNest: 50 }, { x: 108, y: 100, dNest: 40 }] };
const facingX = { x: 100, y: 100, angle: 0 };

test('without PHERO.ahead the next mark can be behind her', () => {
  assert.equal(followPheromone(marks, facingX, 30, true), marks.pheromone[0]);
});

test('with PHERO.ahead her antennae reach only the marks in front of her', () => {
  PHERO.ahead = 1;
  assert.equal(followPheromone(marks, facingX, 30, true), marks.pheromone[1]);
  PHERO.ahead = 0;
});

// A ring of marks: standing nearer and farther by turns, there was always one
// farther than she stood, and she went round it again and again.
test('with PHERO.ahead a trail leads onward: no mark nearer than the last she followed', () => {
  PHERO.ahead = 1;
  const world = createWorld();
  world.rain.timer = Infinity;
  const fagi = createFagi();
  fagi.hunger = 80;
  fagi.angle = 0;
  const nest = addObject(world, fagi.x - 300, fagi.y, 'nest');
  const d = Math.hypot(fagi.x - nest.x, fagi.y - nest.y);
  // Just ahead of her, a mark a little farther from the nest than she stands.
  world.pheromone.push({ x: fagi.x + 8, y: fagi.y, dNest: d + 5, life: PHERO.life, wet: 0 });
  const trail = () => perceive(fagi, world).ranked.find((c) => c.kind === 'trail');
  assert.ok(trail(), 'a mark farther than she stands is the way on');
  // But she came along it from one farther still.
  fagi.target = { x: fagi.x - 8, y: fagi.y, dNest: d + 20 };
  fagi.targetKind = 'phero';
  assert.equal(trail(), undefined, 'going on there would be going back');
  PHERO.ahead = 0;
});

// A scent at its very source: every breath renewed the trail, so she tracked
// it forever around a tree she had already reached.
function atTheTree() {
  const world = createWorld();
  world.rain.timer = Infinity;
  const fagi = createFagi();
  const tree = addObject(world, fagi.x + 60, fagi.y, 'tree');
  for (let k = 0; k < 20; k++) updateTrails(world, 0.1);
  fagi.trailMemory = 3;
  return { world, fagi, key: tree.fruit ?? TREE.fruit };
}

test('without PLUME.arrive the scent at its source keeps her tracking', () => {
  const { world, fagi, key } = atTheTree();
  trackScent(fagi, world, key, 0.05);
  assert.ok(fagi.trailMemory > 0);
});

test('with PLUME.arrive reaching the source ends the trail', () => {
  PLUME.arrive = 1;
  const { world, fagi, key } = atTheTree();
  assert.equal(trackScent(fagi, world, key, 0.05), 1, 'she is at the source');
  assert.equal(fagi.trailMemory, 0);
  PLUME.arrive = 0;
});
