import test from 'node:test';
import assert from 'node:assert/strict';

import { POINT_TYPES, FEEL } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { eat } from '../src/feeding.js';
import { snapshotBody, feel } from '../src/interoception.js';

// Nada en la ficha del alimento dice si es bueno o malo: solo física.
test('the food sheet carries physics only, no verdict', () => {
  for (const spec of Object.values(POINT_TYPES)) {
    assert.equal('reward' in spec, false);
    assert.equal(typeof spec.hunger, 'number');
    assert.ok(Array.isArray(spec.effects));
  }
});

test('a hungry Fagi feels nectar as clearly good, from the hunger it removes', () => {
  const fagi = createFagi();
  fagi.hunger = 60;
  eat(fagi, 'nectar');
  assert.ok(fagi.lastMeal.reward >= 0.8, `reward ${fagi.lastMeal.reward}`);
  assert.ok(fagi.lastMeal.sensations.some((s) => s.sense === 'hunger' && s.v < 0));
  assert.ok(fagi.brain.facts.nectar.value > 0);
});

test('toxic fruit feels bad from what it does to the body: more hunger and slower legs', () => {
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'toxico');
  assert.ok(fagi.lastMeal.reward <= -0.7, `reward ${fagi.lastMeal.reward}`);
  const senses = fagi.lastMeal.sensations.map((s) => s.sense);
  assert.ok(senses.includes('hunger'));
  assert.ok(senses.includes('speed'));
  assert.ok(fagi.brain.facts.toxico.value < 0);
});

test('a speed buff feels good even though it barely feeds', () => {
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'chispa');
  assert.ok(fagi.lastMeal.reward > 0.3, `reward ${fagi.lastMeal.reward}`);
  assert.ok(fagi.lastMeal.sensations.some((s) => s.sense === 'speed' && s.v > 1));
});

test('refreshing an effect that is already active is not felt as a change', () => {
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'chispa');
  const first = fagi.lastMeal.reward;
  fagi.hunger = 50;
  eat(fagi, 'chispa');
  const second = fagi.lastMeal.reward;
  assert.ok(second < first);
  assert.equal(fagi.lastMeal.sensations.some((s) => s.sense === 'speed'), false);
});

test('eating without hunger is felt as almost nothing: the clamp is honest', () => {
  const fagi = createFagi();
  fagi.hunger = 5;
  eat(fagi, 'nectar');
  assert.ok(fagi.lastMeal.reward < 0.2, `reward ${fagi.lastMeal.reward}`);
});

test('feel() is a pure comparison of two body snapshots', () => {
  const before = { hunger: 50, thirst: 20, energy: 80, mults: { speed: 1 } };
  const after = { hunger: 75, thirst: 20, energy: 80, mults: { speed: 0.6 } };
  const { reward, sensations } = feel(before, after);
  const expected = -25 / FEEL.hungerScale + FEEL.effectWeight * FEEL.statSense.speed * Math.log2(0.6);
  assert.ok(Math.abs(reward - Math.max(-1, expected)) < 1e-9);
  assert.equal(sensations.length, 2);

  const fagi = createFagi();
  const snap = snapshotBody(fagi);
  assert.equal(snap.mults.speed, 1);
  assert.equal(snap.mults.hungerRate, 1);
});
