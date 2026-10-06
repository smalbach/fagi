import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRAM, THERMAL, HEALTH, POINT_TYPES, HUNGER } from '../src/config.js';
import { reserves, exploreNow } from '../src/program/watch.js';

const ctx = { hungerU: 0.2, thirstU: 0.1, energyU: 0.7 };
const her = (extra = {}) => ({ thermalStress: 0, health: HEALTH.max, carrying: null, pantry: {}, ...extra });
const nectar = -POINT_TYPES.nectar.hunger / HUNGER.max;

test('reserves: every need counts, added up', () => {
  const was = THERMAL.enabled;
  THERMAL.enabled = 0;
  assert.ok(Math.abs(reserves(her(), ctx) - -(0.2 + 0.1 + 0.3)) < 1e-9);
  THERMAL.enabled = was;
});

test('reserves: food on her back or in the pantry she knows is food to come', () => {
  const base = reserves(her(), ctx);
  assert.ok(Math.abs(reserves(her({ carrying: { type: 'nectar' } }), ctx) - base - nectar) < 1e-9);
  assert.ok(Math.abs(reserves(her({ pantry: { nectar: 2 } }), ctx) - base - 2 * nectar) < 1e-9);
});

test('exploreNow: a fixed chance unless exploreByState, then less the worse she is', () => {
  const was = PROGRAM.exploreByState;
  PROGRAM.exploreByState = 0;
  assert.equal(exploreNow(0.9), PROGRAM.explore);
  PROGRAM.exploreByState = 1;
  assert.equal(exploreNow(0), PROGRAM.explore);
  assert.ok(exploreNow(0.5 ** PROGRAM.power) < exploreNow(0.2 ** PROGRAM.power));
  assert.equal(exploreNow(1), 0);
  PROGRAM.exploreByState = was;
});

test('new learning settings are off by default', () => {
  assert.equal(PROGRAM.judge, 0);
  assert.equal(PROGRAM.darkTrials, 0);
  assert.equal(PROGRAM.exploreByState, 0);
});
