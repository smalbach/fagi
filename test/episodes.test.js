import test from 'node:test';
import assert from 'node:assert/strict';

import { FEEL, THIRST } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { eat } from '../src/feeding.js';
import { step } from '../src/simulation.js';
import { addObject, createWorld } from '../src/world.js';

test('a bite that leaves the need critical within the window is punished a second time', () => {
  const world = createWorld();
  const fagi = createFagi();
  fagi.hunger = 45;                 // below critical (55)
  eat(fagi, 'toxico');              // +25 -> 70: critical right away, and slower
  assert.equal(fagi.brain.facts.toxico.tries, 1);
  assert.ok(fagi.episode?.pending);

  for (let t = 0; t < FEEL.window + 0.1; t += 0.05) step(world, fagi, 0.05);

  assert.equal(fagi.episode, null);
  assert.equal(fagi.brain.facts.toxico.tries, 2);
  assert.equal(fagi.lastEpisode.correction, -FEEL.perilWeight);
  assert.ok(fagi.brain.facts.toxico.value < 0);
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
  const primero = fagi.episode;
  fagi.hunger = 50;
  eat(fagi, 'toxico');
  assert.equal(primero.pending, false);
  assert.equal(primero.correction, null);
  assert.equal(fagi.episode.key, 'toxico');
});

test('dying with a recent bite in the body blames that bite', () => {
  const world = createWorld();
  const fagi = createFagi();
  // Al borde: con el hambre realista (lenta) tiene que morir dentro de
  // FEEL.window para que el bocado cargue con la culpa.
  fagi.hunger = 74.5;
  eat(fagi, 'toxico');              // 99.5
  const antes = fagi.brain.facts.toxico.value;
  for (let t = 0; t < 8 && fagi.alive; t += 0.05) step(world, fagi, 0.05);
  assert.equal(fagi.alive, false);
  assert.equal(fagi.episode, null);
  // Segundo castigo sobre la misma creencia: más negativa que con un solo
  // bocado, aunque la regla delta no llegue de un salto al extremo.
  assert.ok(fagi.brain.facts.toxico.value < antes, `${fagi.brain.facts.toxico.value} vs ${antes}`);
  assert.ok(fagi.brain.facts.toxico.value <= -0.6, `value ${fagi.brain.facts.toxico.value}`);
});

test('water teaches by the thirst it actually removes while drinking', () => {
  const world = createWorld();
  const fagi = createFagi();
  addObject(world, fagi.x, fagi.y, 'agua');
  fagi.thirst = 80;
  step(world, fagi, 0.05);
  assert.equal(fagi.episode?.action, 'drink');
  assert.equal(fagi.brain.facts.agua?.tries ?? 0, 0);   // not judged yet

  for (let t = 0; t < FEEL.drinkSample + 0.1; t += 0.05) step(world, fagi, 0.05);
  assert.equal(fagi.brain.facts.agua.tries, 1);
  assert.ok(fagi.brain.facts.agua.value > 0.2, `value ${fagi.brain.facts.agua.value}`);
  assert.ok(fagi.lastDrink);
  assert.ok(fagi.thirst < 80 - THIRST.drinkRate);
});

test('drinking without thirst teaches nothing because nothing is felt', () => {
  const world = createWorld();
  const fagi = createFagi();
  const pool = addObject(world, fagi.x, fagi.y, 'agua');
  fagi.thirst = 0.5;
  // Sin sed no tiene motivo para quedarse: se pone a explorar y se saldría del
  // charco por su cuenta. Se la mantiene dentro a la fuerza para que la prueba
  // no dependa de hacia dónde tira el paseo aleatorio.
  for (let t = 0; t < FEEL.drinkSample + 0.2; t += 0.05) {
    fagi.x = pool.x; fagi.y = pool.y;
    step(world, fagi, 0.05);
  }
  assert.equal(fagi.brain.facts.agua.tries, 1);
  assert.ok(Math.abs(fagi.brain.facts.agua.value) < 0.05, `value ${fagi.brain.facts.agua.value}`);
});
