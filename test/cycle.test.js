import test from 'node:test';
import assert from 'node:assert/strict';

import { CYCLE, THERMAL } from '../src/config.js';
import { cycleAt, dayAt, lightAt, nightOf, phaseAt } from '../src/cycle.js';
import { createWorld, resetWorld } from '../src/world.js';
import { stepWorld } from '../src/simulation.js';

const on = () => { CYCLE.enabled = 1; };

test('with the cycle off it is always noon at the preferred temperature', () => {
  CYCLE.enabled = 0;
  for (const t of [0, 50, 500, 12345]) {
    assert.deepEqual(cycleAt(t), { day: 1, phase: 0.5, light: 1, ambient: THERMAL.preferred, isNight: false, on: false });
  }
});

test('the phase is a pure function of the clock: same second, same sky', () => {
  on();
  for (const t of [0, 13.7, 179.99, 1000.5]) assert.deepEqual(cycleAt(t), cycleAt(t));
  assert.equal(phaseAt(0), CYCLE.start);
  assert.ok(Math.abs(phaseAt(CYCLE.seconds) - CYCLE.start) < 1e-9, 'one day later, the same phase');
});

test('the day counter turns at midnight', () => {
  on();
  assert.equal(dayAt(0), 1);
  const toMidnight = (1 - CYCLE.start) * CYCLE.seconds;
  assert.equal(dayAt(toMidnight - 0.01), 1);
  assert.equal(dayAt(toMidnight + 0.01), 2);
  assert.equal(dayAt(toMidnight + CYCLE.seconds + 0.01), 3);
});

test('light changes smoothly, stays within its range and is dark at night', () => {
  on();
  let prev = lightAt(0);
  for (let p = 0; p <= 1; p += 0.001) {
    const l = lightAt(p);
    assert.ok(l >= CYCLE.minLight - 1e-9 && l <= 1 + 1e-9);
    assert.ok(Math.abs(l - prev) < 0.05, `no jump at phase ${p.toFixed(3)}`);
    prev = l;
  }
  assert.equal(lightAt(0), CYCLE.minLight);
  assert.equal(lightAt(0.5), 1);
  assert.ok(cycleAt((0.9 - CYCLE.start) * CYCLE.seconds).isNight);
  assert.ok(!cycleAt((0.5 - CYCLE.start) * CYCLE.seconds).isNight);
});

test('the air is warmest in the afternoon and coldest before dawn', () => {
  on();
  const at = (p) => cycleAt(((p - CYCLE.start + 1) % 1) * CYCLE.seconds).ambient;
  assert.ok(Math.abs(at(CYCLE.warmest) - (CYCLE.mean + CYCLE.swing)) < 1e-6);
  assert.ok(Math.abs(at(CYCLE.warmest - 0.5 + 1) - (CYCLE.mean - CYCLE.swing)) < 1e-6);
  assert.ok(at(0.1) < at(0.5));
});

test('the evening and the small hours after it are the same night', () => {
  on();
  const t = (p, day = 0) => ((p - CYCLE.start) + day) * CYCLE.seconds;
  assert.equal(nightOf(t(0.9)), nightOf(t(0.1, 1)));
  assert.notEqual(nightOf(t(0.9)), nightOf(t(0.9, 1)));
});

test('the world records each new day, and a reset restores the cycle', () => {
  on();
  const world = createWorld();
  world.rain.timer = Infinity;
  const days = [];
  world.rec = { emit: (type, data) => { if (type === 'day') days.push(data.day); } };
  for (let i = 0; i < (CYCLE.seconds * 2) / 0.5; i++) stepWorld(world, 0.5);
  assert.deepEqual(days, [1, 2, 3]);
  resetWorld(world);
  assert.equal(world.time, 0);
  assert.deepEqual(cycleAt(world.time), cycleAt(0));
});
