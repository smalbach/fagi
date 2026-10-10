import test from 'node:test';
import assert from 'node:assert/strict';

import { HUNGER, HEALTH, HABITS } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { createWorld } from '../src/world.js';
import { energyMax } from '../src/biology.js';
import { habit, HABIT_SPECS } from '../src/habits.js';
import { godParams, godSet, godPreset, GOD_BODY_RANGE } from '../src/godmode.js';
import { invalidEvent } from '../src/recorder/events.js';

function setup() {
  const world = createWorld();
  const events = [];
  world.rec = { emit: (type, data) => events.push({ seq: events.length, t: 0, type, ...data }) };
  return { world, fagi: createFagi(), events };
}

test('a state number is set, clamped, and recorded as a valid event', () => {
  const { world, fagi, events } = setup();
  assert.deepEqual(godSet(world, fagi, 'hunger', 40), { from: 0, to: 40 });
  assert.equal(fagi.hunger, 40);
  godSet(world, fagi, 'hunger', 9999);
  assert.equal(fagi.hunger, HUNGER.max);
  assert.equal(events.length, 2);
  assert.equal(events[0].type, 'god');
  assert.equal(invalidEvent(events[0]), null);
  assert.equal(world.god, 2);
  assert.equal(fagi.god, 2);
});

test('a drag in progress changes her but records nothing', () => {
  const { world, fagi, events } = setup();
  godSet(world, fagi, 'thirst', 30, { log: false });
  assert.equal(fagi.thirst, 30);
  assert.equal(events.length, 0);
  assert.equal(world.god ?? 0, 0);
});

test('a body trait goes into her genome and rebuilds her body, keeping her energy share', () => {
  const { world, fagi } = setup();
  fagi.energy = energyMax(fagi) / 2;
  godSet(world, fagi, 'body.energyMax', 2);
  assert.equal(fagi.genome.vary.energyMax, 2);
  assert.equal(fagi.body.energyMax, 2);
  assert.ok(Math.abs(fagi.energy / energyMax(fagi) - 0.5) < 1e-9);
  godSet(world, fagi, 'body.speed', 99);
  assert.equal(fagi.body.speed, GOD_BODY_RANGE[1]);
  godPreset(world, fagi, 'standardBody');
  assert.equal(fagi.body.speed, 1);
  assert.equal(fagi.body.energyMax, 1);
});

test('a habit moves to the rung chosen', () => {
  const { world, fagi } = setup();
  const was = HABITS.enabled;
  HABITS.enabled = 1;
  godSet(world, fagi, 'habit.restAt', 3);
  assert.equal(habit(fagi, 'restAt'), HABIT_SPECS.restAt.arms[3]);
  HABITS.enabled = was;
});

test('only the systems that are on are offered, and the dead are left alone', () => {
  const { world, fagi } = setup();
  const was = HEALTH.enabled;
  HEALTH.enabled = 0;
  assert.ok(!godParams(fagi).some((p) => p.id === 'health'));
  assert.equal(godSet(world, fagi, 'health', 10), null);
  HEALTH.enabled = 1;
  assert.ok(godParams(fagi).some((p) => p.id === 'health'));
  HEALTH.enabled = was;
  fagi.alive = false;
  assert.equal(godSet(world, fagi, 'hunger', 10), null);
});

test('filling her needs empties hunger and thirst and fills her energy', () => {
  const { world, fagi } = setup();
  Object.assign(fagi, { hunger: 70, thirst: 80, energy: 5 });
  assert.ok(godPreset(world, fagi, 'restore') >= 3);
  assert.equal(fagi.hunger, 0);
  assert.equal(fagi.thirst, 0);
  assert.equal(fagi.energy, energyMax(fagi));
});
