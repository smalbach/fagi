import test from 'node:test';
import assert from 'node:assert/strict';

import { BASELINE } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { learn } from '../src/brain.js';
import { createWorld, addObject } from '../src/world.js';
import { step } from '../src/simulation.js';

test('the fixed baseline learns nothing from what it lives', () => {
  BASELINE.learn = 0;
  const fagi = createFagi();
  const change = learn(fagi.brain, 'toxic', -0.9, 10);
  assert.equal(change.kind, 'none');
  assert.equal(fagi.brain.facts.toxic.value, 0);
  assert.deepEqual(fagi.brain.rules.list, []);
  assert.deepEqual(fagi.brain.cues, {});
  BASELINE.learn = 1;
  learn(fagi.brain, 'toxic', -0.9, 20);
  assert.ok(fagi.brain.facts.toxic.value < 0, 'and Fagi as she is does');
});

test('the random baseline walks to random points, whatever it perceives', () => {
  BASELINE.policy = 'random';
  const world = createWorld();
  world.rain.timer = Infinity;
  const fagi = createFagi();
  addObject(world, fagi.x + 40, fagi.y, 'water');
  fagi.thirst = 70;
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.rule, 'random');
  assert.ok(fagi.wanderTo);
  BASELINE.policy = 'learner';
  step(world, fagi, 0.05);
  assert.notEqual(fagi.thought.rule, 'random');
});
