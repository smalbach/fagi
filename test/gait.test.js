import test from 'node:test';
import assert from 'node:assert/strict';

import { MOVEMENT, NEEDS, HUNGER } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { createWorld, addObject } from '../src/world.js';
import { updateGait, gradeAt, slopeFactor } from '../src/gait.js';
import { spendEnergy } from '../src/needs.js';

// A world with relief, a Fagi on ground she knows well, nothing pressing.
function setup() {
  const world = createWorld();
  world.seed = 4242;
  const fagi = createFagi();
  fagi.explored.fill(3);
  return { world, fagi };
}

function withGait(fn, sets = {}) {
  const before = { ...MOVEMENT };
  Object.assign(MOVEMENT, { enabled: 1 }, sets);
  try { fn(); } finally { Object.assign(MOVEMENT, before); }
}

test('off, she keeps one pace and one cost everywhere', () => {
  const { world, fagi } = setup();
  fagi.explored.fill(0);
  fagi.raining = true;
  fagi.targetKind = 'nest';
  updateGait(fagi, world);
  assert.equal(fagi.gaitSpeed, 1);
  assert.equal(fagi.gaitEffort, 1);
  assert.equal(fagi.cautious, false);
  assert.equal(fagi.sprinting, false);
});

test('uphill slows her and costs more, downhill eases her', () => withGait(() => {
  const { world, fagi } = setup();
  // Find a clear slope and face up it, then down it.
  let best = null;
  for (let a = 0; a < 6.28; a += 0.2) {
    const g = gradeAt(world, fagi.x, fagi.y, a);
    if (!best || g > best.g) best = { a, g };
  }
  assert.ok(best.g > 0, 'the map has relief under her');
  fagi.angle = best.a;
  updateGait(fagi, world);
  assert.ok(fagi.gaitSpeed < 1, 'slower uphill');
  assert.ok(fagi.gaitEffort > 1, 'costlier uphill');
  fagi.angle = best.a + Math.PI;
  updateGait(fagi, world);
  assert.ok(fagi.gaitSpeed > 1 && fagi.gaitSpeed <= 1.1, 'a little faster downhill');
  assert.equal(fagi.gaitEffort, 1, 'downhill costs what the flat does');
  assert.equal(slopeFactor(0), 1);
}));

test('a map with no seed yet is flat for her', () => withGait(() => {
  const { world, fagi } = setup();
  world.seed = null;
  updateGait(fagi, world);
  assert.equal(fagi.grade, 0);
  assert.equal(fagi.gaitSpeed, 1);
}));

test('on ground she barely knows she crawls, unless a need is critical', () => withGait(() => {
  const { world, fagi } = setup();
  fagi.explored.fill(0);
  fagi.shyness = 1;
  updateGait(fagi, world);
  assert.equal(fagi.cautious, true);
  assert.ok(Math.abs(fagi.gaitSpeed - MOVEMENT.crawlSpeed) < 1e-9);
  fagi.shyness = 0.6;
  updateGait(fagi, world);
  assert.ok(fagi.gaitSpeed > MOVEMENT.crawlSpeed, 'a bolder one slows less');
  fagi.explored.fill(3);
  updateGait(fagi, world);
  assert.equal(fagi.gaitSpeed, 1, 'on ground she knows, no caution');
  fagi.explored.fill(0);
  fagi.shyness = 1;
  fagi.hunger = NEEDS.critical * HUNGER.max;
  updateGait(fagi, world);
  assert.equal(fagi.cautious, false, 'hungry enough, caution goes');
}, { terrainAdapt: 0 }));

test('she sprints home in the rain, pays for it, and stops when nearly spent', () => withGait(() => {
  const { world, fagi } = setup();
  const nest = addObject(world, fagi.x + 300, fagi.y, 'nest');
  fagi.home = nest.id;
  fagi.raining = true;
  fagi.targetKind = 'nest';
  updateGait(fagi, world);
  assert.equal(fagi.sprinting, true);
  assert.equal(fagi.gaitSpeed, MOVEMENT.sprintMult);

  // The same body walking in the same rain, at its plain pace.
  const walk = createFagi();
  walk.raining = true;
  const spent = (f) => { const e0 = f.energy; spendEnergy(f, world, 1, true); return e0 - f.energy; };
  const ratio = spent(fagi) / spent(walk);
  assert.ok(Math.abs(ratio - MOVEMENT.sprintMult) < 1e-6, `a sprint costs ×sprintMult per second (got ×${ratio})`);

  fagi.energy = 0.05 * fagi.energy;
  updateGait(fagi, world);
  assert.equal(fagi.sprinting, false, 'too spent to sprint');
}, { terrainAdapt: 0 }));

test('her pace eases into a change instead of jumping', () => withGait(() => {
  const { world, fagi } = setup();
  fagi.shyness = 1;
  fagi.gaitSpeed = 1;
  fagi.explored.fill(0);
  updateGait(fagi, world, 0.05);
  assert.ok(fagi.gaitSpeed < 1 && fagi.gaitSpeed > MOVEMENT.crawlSpeed, 'part of the way');
  for (let i = 0; i < 100; i++) updateGait(fagi, world, 0.05);
  assert.ok(Math.abs(fagi.gaitSpeed - MOVEMENT.crawlSpeed) < 1e-3, 'there in time');
}, { terrainAdapt: 0 }));

test('going home she is not cautious, however new the ground', () => withGait(() => {
  const { world, fagi } = setup();
  const nest = addObject(world, fagi.x + 300, fagi.y, 'nest');
  fagi.home = nest.id;
  fagi.shyness = 1;
  fagi.explored.fill(0);
  fagi.targetKind = 'nest';
  updateGait(fagi, world);
  assert.equal(fagi.cautious, false);
  assert.equal(fagi.gaitSpeed, 1);
}, { terrainAdapt: 0 }));
