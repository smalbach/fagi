import test from 'node:test';
import assert from 'node:assert/strict';

import { CYCLE, THERMAL, HUNGER, THIRST } from '../src/config.js';
import { createFagi, updateFagi } from '../src/fagi.js';
import { createWorld, addObject } from '../src/world.js';
import { step } from '../src/simulation.js';
import { senseBody, thermalFactors, discomfort } from '../src/thermal.js';
import { increaseNeeds, resolveVitalFailure } from '../src/needs.js';
import { recall } from '../src/memory.js';

THERMAL.enabled = 1;
CYCLE.enabled = 1;

// A world with a fixed air temperature: the cycle's mean, no swing.
function weather(temp) {
  CYCLE.mean = temp;
  CYCLE.swing = 0;
  const world = createWorld();
  world.rain.timer = Infinity;
  return world;
}

function settle(fagi, world, secs, dt = 0.1) {
  for (let t = 0; t < secs; t += dt) { world.time += dt; senseBody(fagi, world, dt); }
}

test('the body converges to the air', () => {
  const world = weather(10);
  const fagi = createFagi();
  settle(fagi, world, 200);
  assert.ok(Math.abs(fagi.temperature - 10) < 0.2, `${fagi.temperature}`);
});

test('the nest softens the extremes', () => {
  for (const air of [4, 40]) {
    const world = weather(air);
    const out = createFagi();
    const inside = createFagi();
    addObject(world, inside.x, inside.y, 'nest');
    out.x += 400;
    settle(out, world, 200);
    settle(inside, world, 200);
    assert.ok(Math.abs(inside.temperature - THERMAL.preferred) < Math.abs(out.temperature - THERMAL.preferred),
      `air ${air}: inside ${inside.temperature}, outside ${out.temperature}`);
  }
});

test('being soaked speeds up the exchange (and chills)', () => {
  const world = weather(10);
  const dry = createFagi();
  const wet = createFagi();
  wet.wet = 999;
  settle(dry, world, 5);
  settle(wet, world, 5);
  assert.ok(wet.temperature < dry.temperature - 1, `dry ${dry.temperature}, wet ${wet.temperature}`);
});

test('walking makes a little heat, and only a little', () => {
  const world = weather(20);
  const still = createFagi();
  const walking = createFagi();
  walking.moving = true;
  settle(still, world, 300);
  settle(walking, world, 300);
  const extra = walking.temperature - still.temperature;
  assert.ok(extra > 0 && extra <= THERMAL.moveHeat + 1e-6, `${extra}`);
});

test('the cold burns reserves, the heat dries her out, and comfort changes nothing', () => {
  const fagi = createFagi();
  fagi.temperature = THERMAL.preferred;
  assert.deepEqual(thermalFactors(fagi), { hunger: 1, thirst: 1, speed: 1 });
  fagi.temperature = THERMAL.safeMin - 5;
  const cold = thermalFactors(fagi);
  assert.ok(cold.hunger > 1 && cold.speed < 1 && cold.thirst === 1);
  fagi.temperature = THERMAL.safeMax + 5;
  const hot = thermalFactors(fagi);
  assert.ok(hot.thirst > 1 && hot.hunger === 1);

  const world = weather(20);
  const a = createFagi();
  const b = createFagi();
  a.temperature = THERMAL.preferred;
  b.temperature = THERMAL.safeMax + 5;
  increaseNeeds(a, world, 10);
  increaseNeeds(b, world, 10);
  assert.ok(b.thirst > a.thirst);
  assert.equal(b.hunger, a.hunger);
});

test('accumulated stress kills, and a death of cold is told as such', () => {
  const world = weather(0);
  const fagi = createFagi();
  fagi.temperature = 8;
  for (let t = 0; t < 400 && fagi.alive; t += 0.1) {
    world.time += 0.1;
    senseBody(fagi, world, 0.1);
    resolveVitalFailure(fagi);
  }
  assert.equal(fagi.alive, false);
  assert.equal(fagi.cause, 'cold');
  assert.ok(fagi.hunger < HUNGER.max && fagi.thirst < THIRST.max);
});

test('back in the safe range, stress recovers', () => {
  const world = weather(THERMAL.preferred);
  const fagi = createFagi();
  fagi.thermalStress = 50;
  settle(fagi, world, 10);
  assert.ok(fagi.thermalStress < 50 - THERMAL.recover * 9);
});

test('she learns the cold hurts, and that the nest helps, without being told', () => {
  const world = weather(5);
  const fagi = createFagi();
  settle(fagi, world, 60);
  assert.ok(recall(fagi.brain, 'cold').value < 0, 'the cold is bad');
  assert.equal(fagi.brain.facts.refuge, undefined, 'she does not know about the nest yet');
  addObject(world, fagi.x, fagi.y, 'nest');
  settle(fagi, world, THERMAL.refugeSample + 1);
  assert.ok(recall(fagi.brain, 'refuge').value > 0, 'inside, it passed');
});

test('once the dark has meant cold, she heads home at dusk', () => {
  CYCLE.mean = 22; CYCLE.swing = 12;
  const world = createWorld();
  world.rain.timer = Infinity;
  const fagi = createFagi();
  addObject(world, fagi.x + 300, fagi.y, 'nest');
  // She has lived it before: the dark came before the cold.
  recall(fagi.brain, 'dusk');
  Object.assign(fagi.brain.facts.dusk, { value: -0.8, confidence: 0.9, tries: 3 });
  world.time = (CYCLE.dusk + 0.05 - CYCLE.start) * CYCLE.seconds;
  step(world, fagi, 0.05);
  assert.ok(fagi.dark);
  assert.equal(fagi.thought.rule, 'dusk');
  assert.equal(fagi.target?.type, 'nest');
});

test('about to die of cold, a reflex takes her home whatever pulls her out', () => {
  const world = weather(2);
  const fagi = createFagi();
  addObject(world, fagi.x + 300, fagi.y, 'nest');
  fagi.temperature = 5;
  fagi.thermalStress = THERMAL.reflex * THERMAL.maxStress + 1;
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.rule, 'thermalReflex');
  assert.equal(fagi.target?.type, 'nest');
});

test('with THERMAL off nothing about her temperature moves', () => {
  THERMAL.enabled = 0;
  const world = weather(0);
  const fagi = createFagi();
  for (let i = 0; i < 200; i++) updateFagi(fagi, world, 0.1);
  assert.equal(fagi.temperature, THERMAL.preferred);
  assert.equal(fagi.thermalStress, 0);
  assert.equal(discomfort(fagi.temperature).kind, null);
  THERMAL.enabled = 1;
});
