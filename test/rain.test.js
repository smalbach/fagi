import test from 'node:test';
import assert from 'node:assert/strict';

import { RAIN, WATER, FAGI, THIRST, ENERGY, HUNGER, NEST } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { step } from '../src/simulation.js';
import { addObject, createWorld, removeObject, storeInNest } from '../src/world.js';
import { updateRain, isPuddle } from '../src/rain.js';
import { waterZone } from '../src/obstacles.js';
import { dropPheromone } from '../src/pheromone.js';
import { recallPlace, recall, weight } from '../src/memory.js';
import { verdict } from '../src/learned/rules.js';
import { perceive } from '../src/perception.js';

const rainNow = (world) => { world.rain.timer = 0; updateRain(world, 0.01); };

test('a shower leaves shallow puddles that dry up in the sun', () => {
  const world = createWorld();
  rainNow(world);
  assert.equal(world.rain.on, true);
  for (let t = 0; t < RAIN.duration.max + 1; t += 0.5) updateRain(world, 0.5);
  assert.equal(world.rain.on, false);
  const puddles = world.objects.filter(isPuddle);
  assert.ok(puddles.length >= RAIN.puddles.min, `${puddles.length} puddles`);
  for (const c of puddles) assert.equal(waterZone(world, c.x, c.y).deep, false, 'she can always stand in a puddle');

  world.rain.timer = Infinity;
  for (let t = 0; t < 2000 && world.objects.some(isPuddle); t += 1) updateRain(world, 1);
  assert.equal(world.objects.filter(isPuddle).length, 0, 'they all dry up');
});

test('rain soaks her outside the nest and washes the pheromone away faster', () => {
  const world = createWorld();
  const fagi = createFagi();
  dropPheromone(world, 100, 100, 50);
  const life = world.pheromone[0].life;
  rainNow(world);
  step(world, fagi, 0.1);
  assert.equal(fagi.wet, WATER.dryTime);
  assert.ok(life - world.pheromone[0].life >= 0.1 * RAIN.washPhero - 1e-9);
});

test('rain sends her to the nest to wait it out', () => {
  const world = createWorld();
  const fagi = createFagi();
  addObject(world, fagi.x + 200, fagi.y, 'nest');
  rainNow(world);
  world.rain.left = 999;
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.action, 'shelter');
});

test('the air pressure drops before the rain, stays low while it rains and recovers after', () => {
  const world = createWorld();
  updateRain(world, 0.01);
  const rain = world.rain;
  rain.timer = rain.front = 40;
  updateRain(world, 20);
  assert.ok(Math.abs(rain.drop - 0.5) < 1e-9, `halfway through the front: ${rain.drop}`);
  updateRain(world, 20.01);
  assert.equal(rain.on, true);
  updateRain(world, 1);
  assert.equal(rain.drop, 1);
  rain.left = 0;
  updateRain(world, 0.01);
  assert.equal(rain.on, false);
  updateRain(world, RAIN.recover / 2);
  assert.ok(rain.drop < 0.6 && rain.drop > 0.4, `recovering: ${rain.drop}`);
});

test('a naive ant with some thirst keeps working in the rain; getting soaked teaches her to shelter', () => {
  const world = createWorld();
  const fagi = createFagi();
  addObject(world, fagi.x + 300, fagi.y, 'nest');
  fagi.thirst = THIRST.max * 0.35;     // pulls at her more than instinct alone
  rainNow(world);
  world.rain.left = 999;
  step(world, fagi, 0.05);
  assert.notEqual(fagi.thought.action, 'shelter', 'at birth it is not enough for her');

  for (let t = 0; t < RAIN.sample * 3 && fagi.alive; t += 0.1) { fagi.thirst = THIRST.max * 0.35; step(world, fagi, 0.1); }
  assert.ok(recall(fagi.brain, 'rain').value < 0, 'getting wet feels bad');
  assert.equal(verdict(fagi, 'pursue', 'rain'), 'avoid', 'and she writes it as a rule');
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.action, 'shelter', 'now she shelters even with some thirst');
});

test('a pressure drop means nothing until it has come before the rain; then she heads home early', () => {
  const world = createWorld();
  const fagi = createFagi();
  addObject(world, fagi.x + 300, fagi.y, 'nest');
  fagi.thirst = 0;
  const front = () => {
    updateRain(world, 0.01);
    world.rain.timer = world.rain.front = 30;
    world.rain.drop = 0;
    for (let t = 0; t < 20; t += 0.1) step(world, fagi, 0.1);
  };

  front();
  assert.equal(fagi.pressureFalling, true, 'she notices it dropping (instinct)');
  assert.notEqual(fagi.thought.action, 'shelter', 'but does not know what it heralds');
  assert.equal(fagi.brain.facts.pressure, undefined, 'she does not even hold a belief about it');
  assert.equal(fagi.brain.facts.rain, undefined);

  // It rains on her and clears up: she learns the rain and, with it, what the
  // front heralded. Twice, so the association carries weight.
  const soaked = () => {
    world.rain.timer = 0;
    for (let t = 0; world.rain.on || t < 1; t += 0.1) {
      fagi.x = 100; fagi.y = 100;     // stays out in the open
      step(world, fagi, 0.1);
    }
    for (let t = 0; t < 1; t += 0.1) step(world, fagi, 0.1);
  };
  soaked();
  assert.ok(weight(fagi.brain, 'pressure') < 0, 'the drop now means rain');
  front();
  soaked();

  world.rain.drop = 0;
  fagi.pressure = 0;
  fagi.energy = ENERGY.max; fagi.resting = false; fagi.wet = 0;
  fagi.thirst = 0; fagi.hunger = 0;
  front();
  assert.equal(world.rain.on, false, 'not raining yet');
  assert.ok(['shelter', 'rest'].includes(fagi.thought.action), fagi.thought.action);
  assert.equal(fagi.thought.rule, 'anticipate');
});

test('a puddle found dry makes her trust puddles less', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  const puddle = addObject(world, fagi.x + 60, fagi.y, 'puddle', 15);
  step(world, fagi, 0.05);
  removeObject(world, puddle, 'dried');
  step(world, fagi, 0.05);
  assert.ok(recall(fagi.brain, 'puddle').value < 0);
});

test('she only learns a remembered puddle is gone when she goes back and looks', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  const puddle = addObject(world, fagi.x + 60, fagi.y, 'puddle', 15);
  fagi.thirst = 5;
  step(world, fagi, 0.05);
  assert.ok(recallPlace(fagi.brain, 'puddle'), 'she sees it and remembers it');

  removeObject(world, puddle, 'dried');
  fagi.x -= 400;                      // far away: she does not know it has dried up
  step(world, fagi, 0.05);
  assert.ok(recallPlace(fagi.brain, 'puddle'));
  fagi.x += 400;                      // comes back and looks
  step(world, fagi, 0.05);
  assert.equal(recallPlace(fagi.brain, 'puddle'), null);
  assert.equal(fagi.puddleGone, 1);
});

test('antennae feel the water before the body gets in, and she slows to probe', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  const R = 44;
  // The edge of the deep water, just within reach of the antennae.
  addObject(world, fagi.x + FAGI.radius + WATER.probeReach + (R - WATER.shallows) - 2, fagi.y, 'water');
  step(world, fagi, 0.05);
  assert.equal(fagi.swimming, false);
  assert.equal(fagi.probing, true);
  assert.ok(fagi.brain.synapses['sense:antennae>key:deep']);
});

test('after deep water she stays soaked and slow until she dries', () => {
  const world = createWorld();
  const fagi = createFagi();
  addObject(world, fagi.x, fagi.y, 'water');
  for (let t = 0; t < 20 && (fagi.swimming || t === 0); t += 0.05) step(world, fagi, 0.05);
  assert.equal(fagi.swimming, false);
  assert.ok(fagi.wet > WATER.dryTime - 0.2, 'she comes out soaked');
  for (let t = 0; t < WATER.dryTime + 0.5; t += 0.05) step(world, fagi, 0.05);
  assert.equal(fagi.wet, 0, 'and dries off');
});

test('seeing a remembered puddle never makes it look worse than remembering it', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  fagi.thirst = THIRST.max * 0.4;
  addObject(world, fagi.x + 115, fagi.y, 'puddle', 12);   // at the edge of sight
  const water = () => perceive(fagi, world).ranked.find((c) => c.kind === 'water');
  const sight = water();
  assert.equal(sight.via, 'sight');
  fagi.angle = Math.PI;               // turns around: now she only remembers it
  const memoryOf = water();
  assert.equal(memoryOf.via, 'memory');
  assert.ok(sight.score >= memoryOf.score, `sight ${sight.score} < memory ${memoryOf.score}`);
});

test('sleeping in the nest out of the rain, hunger and thirst rise far slower, and she eats from the pantry', () => {
  const world = createWorld();
  const fagi = createFagi();
  const nestObj = addObject(world, fagi.x, fagi.y, 'nest');
  rainNow(world);
  world.rain.left = 999;
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.action, 'rest');
  const h0 = fagi.hunger, s0 = fagi.thirst;
  for (let i = 0; i < 100; i++) step(world, fagi, 0.1);
  assert.ok(fagi.thirst - s0 < THIRST.rate * 10 * NEST.restThirst + 1e-6, `thirst ${fagi.thirst - s0}`);
  assert.ok(fagi.hunger - h0 < HUNGER.rate * 10 * NEST.restHunger + 1e-6, `hunger ${fagi.hunger - h0}`);

  // The rain drags on and she gets hungry: she eats from the stores without going out.
  storeInNest(nestObj, 'nectar'); storeInNest(nestObj, 'nectar');
  fagi.hunger = HUNGER.max * 0.5;
  step(world, fagi, 0.1);
  assert.equal(nestObj.stock.nectar, 1);
  assert.ok(fagi.hunger < HUNGER.max * 0.5);
});

test('what it learned about weather goes into its code: rules only about pursuing, and how long a puddle lasts', async () => {
  const { exportText, importText } = await import('../src/learned/store.js');
  const { learn } = await import('../src/brain.js');
  const fagi = createFagi();
  for (let i = 0; i < 3; i++) learn(fagi.brain, 'rain', -0.8, i * 20);
  fagi.brain.puddleLife = 180;
  const rule = fagi.brain.rules.list.find((r) => r.id === 'avoid-rain');
  assert.deepEqual(rule.on, ['pursue'], 'rain is not eaten');

  const text = exportText(fagi);
  const another = createFagi();
  importText(another, text);
  assert.equal(another.brain.puddleLife, 180);
  assert.equal(verdict(another, 'pursue', 'rain'), 'avoid');
});

test('rain washes scent trails away and they grow back once it clears', async () => {
  const { updateTrails } = await import('../src/smell.js');
  const { addPoint } = await import('../src/world.js');
  const world = createWorld();
  addPoint(world, 400, 400, 'nectar');
  world.rain.timer = Infinity;
  for (let t = 0; t < 30; t += 0.1) updateTrails(world, 0.1);
  const longOnes = () => world.points.map((p) => p.trail?.nodes.length ?? 0);
  assert.ok(longOnes().some((n) => n > 5), 'in the sun the scent spreads');

  rainNow(world);
  for (let t = 0; t < RAIN.washScent + 1; t += 0.1) updateTrails(world, 0.1);
  assert.ok(longOnes().every((n) => n <= 1), 'rain leaves the scent only at the source');

  world.rain.on = false;
  for (let t = 0; t < 5; t += 0.1) updateTrails(world, 0.1);
  assert.ok(longOnes().some((n) => n > 5), 'when it clears it spreads out again');
});
