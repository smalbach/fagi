import test from 'node:test';
import assert from 'node:assert/strict';

import { RAIN, WATER, FAGI } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { step } from '../src/simulation.js';
import { addObject, createWorld, removeObject } from '../src/world.js';
import { updateRain, isPuddle } from '../src/rain.js';
import { waterZone } from '../src/obstacles.js';
import { dropPheromone } from '../src/pheromone.js';
import { recallPlace } from '../src/memory.js';

const llover = (world) => { world.rain.timer = 0; updateRain(world, 0.01); };

test('a shower leaves shallow puddles that dry up in the sun', () => {
  const world = createWorld();
  llover(world);
  assert.equal(world.rain.on, true);
  for (let t = 0; t < RAIN.duration.max + 1; t += 0.5) updateRain(world, 0.5);
  assert.equal(world.rain.on, false);
  const charcos = world.objects.filter(isPuddle);
  assert.ok(charcos.length >= RAIN.puddles.min, `${charcos.length} charcos`);
  for (const c of charcos) assert.equal(waterZone(world, c.x, c.y).deep, false, 'en un charco siempre hace pie');

  world.rain.timer = Infinity;
  for (let t = 0; t < 2000 && world.objects.some(isPuddle); t += 1) updateRain(world, 1);
  assert.equal(world.objects.filter(isPuddle).length, 0, 'se secan todos');
});

test('rain soaks her outside the nest and washes the pheromone away faster', () => {
  const world = createWorld();
  const fagi = createFagi();
  dropPheromone(world, 100, 100, 50);
  const vida = world.pheromone[0].life;
  llover(world);
  step(world, fagi, 0.1);
  assert.equal(fagi.wet, WATER.dryTime);
  assert.ok(vida - world.pheromone[0].life >= 0.1 * RAIN.washPhero - 1e-9);
});

test('rain sends her to the nest to wait it out', () => {
  const world = createWorld();
  const fagi = createFagi();
  addObject(world, fagi.x + 200, fagi.y, 'nido');
  llover(world);
  world.rain.left = 999;
  step(world, fagi, 0.05);
  assert.equal(fagi.thought.action, 'shelter');
});

test('she only learns a remembered puddle is gone when she goes back and looks', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  const charco = addObject(world, fagi.x + 60, fagi.y, 'charco', 15);
  fagi.thirst = 5;
  step(world, fagi, 0.05);
  assert.ok(recallPlace(fagi.brain, 'charco'), 'lo ve y lo recuerda');

  removeObject(world, charco, 'dried');
  fagi.x -= 400;                      // lejos: no sabe que se ha secado
  step(world, fagi, 0.05);
  assert.ok(recallPlace(fagi.brain, 'charco'));
  fagi.x += 400;                      // vuelve y mira
  step(world, fagi, 0.05);
  assert.equal(recallPlace(fagi.brain, 'charco'), null);
  assert.equal(fagi.puddleGone, 1);
});

test('antennae feel the water before the body gets in, and she slows to probe', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.angle = 0;
  const R = 44;
  // El borde del hondo, justo al alcance de las antenas.
  addObject(world, fagi.x + FAGI.radius + WATER.probeReach + (R - WATER.vado) - 2, fagi.y, 'agua');
  step(world, fagi, 0.05);
  assert.equal(fagi.swimming, false);
  assert.equal(fagi.probing, true);
  assert.ok(fagi.brain.synapses['sense:antenas>key:hondo']);
});

test('after deep water she stays soaked and slow until she dries', () => {
  const world = createWorld();
  const fagi = createFagi();
  addObject(world, fagi.x, fagi.y, 'agua');
  for (let t = 0; t < 20 && (fagi.swimming || t === 0); t += 0.05) step(world, fagi, 0.05);
  assert.equal(fagi.swimming, false);
  assert.ok(fagi.wet > WATER.dryTime - 0.2, 'sale empapada');
  for (let t = 0; t < WATER.dryTime + 0.5; t += 0.05) step(world, fagi, 0.05);
  assert.equal(fagi.wet, 0, 'y se seca');
});
