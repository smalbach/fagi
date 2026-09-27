import test from 'node:test';
import assert from 'node:assert/strict';

import { FEEL, THIRST, OBJECT_TYPES, WATER } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { eat } from '../src/feeding.js';
import { step } from '../src/simulation.js';
import { addObject, createWorld } from '../src/world.js';

test('a bite that leaves the need critical within the window is punished a second time', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.hunger = 45;                 // below critical (55)
  eat(fagi, 'toxic');              // +25 -> 70: critical right away, and slower
  assert.equal(fagi.brain.facts.toxic.tries, 1);
  assert.ok(fagi.episode?.pending);

  for (let t = 0; t < FEEL.window + 0.1; t += 0.05) step(world, fagi, 0.05);

  assert.equal(fagi.episode, null);
  assert.equal(fagi.brain.facts.toxic.tries, 2);
  assert.equal(fagi.lastEpisode.correction, -FEEL.perilWeight);
  assert.ok(fagi.brain.facts.toxic.value < 0);
});

test('a bite that turns out fine closes without touching the belief again', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'nectar');
  for (let t = 0; t < FEEL.window + 0.1; t += 0.05) step(world, fagi, 0.05);
  assert.equal(fagi.episode, null);
  assert.equal(fagi.brain.facts.nectar.tries, 1);
  assert.equal(fagi.lastEpisode.correction, null);
});

test('opening a new episode closes the previous one without blaming it', () => {
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'nectar');
  const firstOne = fagi.episode;
  fagi.hunger = 50;
  eat(fagi, 'toxic');
  assert.equal(firstOne.pending, false);
  assert.equal(firstOne.correction, null);
  assert.equal(fagi.episode.key, 'toxic');
});

test('dying with a recent bite in the body blames that bite', () => {
  const world = createWorld();
  const fagi = createFagi();
  // On the edge: with realistic (slow) hunger she has to die within
  // FEEL.window for the bite to take the blame.
  fagi.hunger = 74.5;
  eat(fagi, 'toxic');              // 99.5
  const before = fagi.brain.facts.toxic.value;
  for (let t = 0; t < 8 && fagi.alive; t += 0.05) step(world, fagi, 0.05);
  assert.equal(fagi.alive, false);
  assert.equal(fagi.episode, null);
  // Second punishment on the same belief: more negative than with a single
  // bite, even if the delta rule does not reach the extreme in one jump.
  assert.ok(fagi.brain.facts.toxic.value < before, `${fagi.brain.facts.toxic.value} vs ${before}`);
  assert.ok(fagi.brain.facts.toxic.value <= -0.6, `value ${fagi.brain.facts.toxic.value}`);
});

test('water teaches by the thirst it actually removes while drinking', () => {
  const world = createWorld();
  const fagi = createFagi();
  // In the shallows, where she can stand: in deep water she does not drink, she flails.
  addObject(world, fagi.x + OBJECT_TYPES.water.radius - WATER.shallows / 2, fagi.y, 'water');
  fagi.thirst = 80;
  step(world, fagi, 0.05);
  assert.equal(fagi.episode?.action, 'drink');
  assert.equal(fagi.brain.facts.water?.tries ?? 0, 0);   // not judged yet

  for (let t = 0; t < FEEL.drinkSample + 0.1; t += 0.05) step(world, fagi, 0.05);
  assert.equal(fagi.brain.facts.water.tries, 1);
  assert.ok(fagi.brain.facts.water.value > 0.2, `value ${fagi.brain.facts.water.value}`);
  assert.ok(fagi.lastDrink);
  assert.ok(fagi.thirst < 80 - THIRST.drinkRate);
});

test('drinking without thirst teaches nothing because nothing is felt', () => {
  const world = createWorld();
  const fagi = createFagi();
  const shore = OBJECT_TYPES.water.radius - WATER.shallows / 2;
  const pool = addObject(world, fagi.x + shore, fagi.y, 'water');
  fagi.thirst = 0.5;
  // Without thirst she has no reason to stay: she starts exploring and would leave
  // the pool on her own. She is held inside by force so the test does not
  // depend on where the random walk takes her.
  for (let t = 0; t < FEEL.drinkSample + 0.2; t += 0.05) {
    fagi.x = pool.x - shore; fagi.y = pool.y;
    step(world, fagi, 0.05);
  }
  assert.equal(fagi.brain.facts.water.tries, 1);
  assert.ok(Math.abs(fagi.brain.facts.water.value) < 0.05, `value ${fagi.brain.facts.water.value}`);
});

test('walking through the shallows without stopping is not drinking and teaches nothing', () => {
  const world = createWorld();
  const fagi = createFagi();
  const pool = addObject(world, fagi.x + OBJECT_TYPES.water.radius - WATER.shallows / 2, fagi.y, 'water');
  // She is barely thirsty: the shallows quench it as she steps in and she does not even stop to drink.
  // Walking around the lake this happens often; if it counted, water "would not quench thirst".
  fagi.thirst = 0.1;
  step(world, fagi, 0.05);
  assert.equal(fagi.episode?.action, 'drink');
  assert.notEqual(fagi.thought.action, 'drink');
  fagi.x = pool.x - 200;
  step(world, fagi, 0.05);   // leaves the water
  step(world, fagi, 0.05);   // and the episode closes without judging
  assert.equal(fagi.brain.facts.water?.tries ?? 0, 0, 'a sip in passing is not judged');
  assert.equal(fagi.episode, null);
});
