import test from 'node:test';
import assert from 'node:assert/strict';

import { FAGI, WATER, OBJECT_TYPES } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { step } from '../src/simulation.js';
import { addObject, createWorld } from '../src/world.js';
import { waterZone } from '../src/obstacles.js';
import { fearsDeep, DEEP } from '../src/swim.js';
import { moveToward } from '../src/movement.js';

const R = OBJECT_TYPES.water.radius;

test('deep water slows her to a paddle and she heads for the nearest shore', () => {
  const world = createWorld();
  const fagi = createFagi();
  const pool = addObject(world, fagi.x + 5, fagi.y, 'water');   // almost at the centre
  fagi.angle = 0;                                             // facing inwards
  const x0 = fagi.x;
  step(world, fagi, 0.05);
  assert.equal(fagi.swimming, true);
  assert.equal(fagi.thought.action, 'swimOut');
  assert.equal(fagi.drinking, false, 'she does not drink in deep water');
  assert.ok(Math.abs(fagi.x - x0) <= FAGI.speed * WATER.swimSpeed * 0.05 + 1e-9, 'she paddles, barely advancing');

  for (let t = 0; t < 20 && waterZone(world, fagi.x, fagi.y)?.deep; t += 0.05) step(world, fagi, 0.05);
  assert.ok(!waterZone(world, fagi.x, fagi.y)?.deep, 'she ends up getting out');
  assert.ok(Math.hypot(fagi.x - pool.x, fagi.y - pool.y) > 0);
});

test('sinking teaches: the belief about deep water drops and an avoid rule is written', () => {
  const world = createWorld();
  const fagi = createFagi();
  addObject(world, fagi.x, fagi.y, 'water');
  assert.equal(fearsDeep(fagi), false, 'she is born not knowing it');
  for (let t = 0; t < 20 && !fearsDeep(fagi); t += 0.05) step(world, fagi, 0.05);
  assert.ok(fagi.brain.facts[DEEP].value < 0);
  assert.equal(fearsDeep(fagi), true);
  assert.ok(fagi.brain.rules.list.some((r) => r.id === `avoid-${DEEP}` && !r.retired));
});

test('once learned, she goes around the lake instead of across it', () => {
  const crosses = (learnedOne) => {
    const world = createWorld();
    const fagi = createFagi();
    fagi.x = 300; fagi.y = 400; fagi.angle = 0;
    addObject(world, 420, 400, 'water');
    if (learnedOne) {
      fagi.brain.rules.list.push({ id: `avoid-${DEEP}`, on: ['pursue'], when: { key: DEEP }, verdict: 'avoid' });
    }
    const meta = { x: 540, y: 400 };
    let deep = 0;
    for (let t = 0; t < 30 && Math.hypot(meta.x - fagi.x, meta.y - fagi.y) > 10; t += 0.05) {
      moveToward(fagi, world, meta, 0.05);
      if (waterZone(world, fagi.x, fagi.y)?.deep) deep += 0.05;
    }
    return { deep, arrives: Math.hypot(meta.x - fagi.x, meta.y - fagi.y) <= 10 };
  };
  assert.ok(crosses(false).deep > 0, 'without learning, she goes in');
  const after = crosses(true);
  assert.equal(after.deep, 0, 'once learned, she does not step into deep water');
  assert.equal(after.arrives, true, 'and still gets there, going around');
});

test('she drinks from the shallow edge, never needing to swim', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.x = 300; fagi.y = 400; fagi.angle = 0;
  addObject(world, 300 + 120, 400, 'water');
  fagi.thirst = 70;
  let drank = false;
  for (let t = 0; t < 20 && !drank; t += 0.05) {
    step(world, fagi, 0.05);
    assert.equal(fagi.swimming, false);
    drank = fagi.drinking;
  }
  assert.ok(drank);
  assert.ok(Math.hypot(fagi.x - 420, fagi.y - 400) > R - WATER.shallows, 'in the shallows');
});

test('pressed against the deep edge she never gets stuck turning around', () => {
  for (const sideOf of [1, -1]) {
    const world = createWorld();
    const fagi = createFagi();
    const pool = addObject(world, 400, 400, 'water');
    fagi.brain.rules.list.push({ id: `avoid-${DEEP}`, on: ['pursue'], when: { key: DEEP }, verdict: 'avoid' });
    // At the edge of the deep water, facing along the shore, with the goal on the other side.
    const d = R - WATER.shallows + 0.05;
    fagi.x = pool.x - d; fagi.y = pool.y;
    fagi.angle = sideOf * Math.PI / 2;
    fagi.energy = 0;                                 // dragging herself, as in the real case
    const meta = { x: pool.x + R + 60, y: pool.y };
    for (let t = 0; t < 60 && Math.hypot(meta.x - fagi.x, meta.y - fagi.y) > 12; t += 0.05) {
      moveToward(fagi, world, meta, 0.05);
      assert.ok(!waterZone(world, fagi.x, fagi.y)?.deep);
    }
    assert.ok(Math.hypot(meta.x - fagi.x, meta.y - fagi.y) <= 12, `side ${sideOf}: gets there going around`);
  }
});
