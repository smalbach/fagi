import test from 'node:test';
import assert from 'node:assert/strict';

import { HEALTH, THERMAL } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { hurt, updateHealth, healthSpeed, healthU, woundsCause } from '../src/health.js';
import { resolveVitalFailure } from '../src/needs.js';
import { looksWell } from '../src/reproduction.js';

test('with HEALTH off nothing is hurt, and speed and looks are untouched', () => {
  const f = createFagi();
  hurt(f, 50, 'sting');
  assert.equal(f.health, undefined);
  assert.equal(healthSpeed(f), 1);
  assert.equal(healthU(f), 1);
});

test('harm takes health, it mends while nothing presses, faster at rest', () => {
  HEALTH.enabled = 1;
  const f = createFagi();
  hurt(f, 40, 'sting');
  assert.equal(f.health, 60);
  updateHealth(f, 10, false);
  assert.ok(Math.abs(f.health - (60 + HEALTH.heal * 10)) < 1e-9);
  const g = createFagi();
  hurt(g, 40, 'sting');
  updateHealth(g, 10, true);
  assert.ok(g.health > f.health, 'resting mends faster');
  f.hunger = 90;
  const h = f.health;
  updateHealth(f, 10, false);
  assert.equal(f.health, h, 'starving, nothing mends');
  HEALTH.enabled = 0;
});

test('hurt, she walks slower and looks worse; at zero she dies of what hurt her', () => {
  HEALTH.enabled = 1;
  const f = createFagi();
  const well = looksWell(f);
  hurt(f, 80, 'poison');
  assert.ok(healthSpeed(f) < 1 && healthSpeed(f) >= HEALTH.slowest);
  assert.ok(looksWell(f) < well);
  hurt(f, 30, 'sting');
  assert.equal(woundsCause(f), 'wounds');
  assert.equal(resolveVitalFailure(f), true);
  assert.equal(f.cause, 'wounds');
  HEALTH.enabled = 0;
});

test('heat beyond half of what kills harms her health', () => {
  HEALTH.enabled = 1; THERMAL.enabled = 1;
  const f = createFagi();
  f.thermalStress = THERMAL.maxStress * 0.8;
  f.thermalKind = 'heat';
  updateHealth(f, 2, false);
  assert.ok(f.health < HEALTH.max);
  assert.equal(f.hurtBy, 'heat');
  HEALTH.enabled = 0; THERMAL.enabled = 0;
});
