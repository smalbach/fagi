import test from 'node:test';
import assert from 'node:assert/strict';

import { APPETITE, HUNGER, THIRST } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { eat, tryPickOrEat } from '../src/feeding.js';
import { canEat, aversive, uselessNow } from '../src/appetite.js';
import { resolveVitalFailure } from '../src/needs.js';
import { thirstSearch } from '../src/decision/provide.js';
import { pantryIntent } from '../src/decision/common.js';
import { registerSpecies } from '../src/chemistry.js';
import { createWorld, addPoint } from '../src/world.js';

// Two poison fruit sharing a smell, one poison with its own smell, and a good one.
function species() {
  const make = (color, shape, smell, hunger) => ({
    key: `${color}-${shape}-${smell}`,
    spec: { color: '#888', radius: 6, aroma: 100, life: 200, hunger, effects: [], traits: { color, shape, smell }, species: true },
  });
  registerSpecies([
    make('red', 'round', 'sour', 25),
    make('green', 'drop', 'sour', 25),
    make('red', 'orb', 'musky', 25),
    make('blue', 'crystal', 'sweet', -35),
  ]);
}

function sickFagi() {
  const fagi = createFagi();
  fagi.hunger = 40;
  eat(fagi, 'red-round-sour');
  return fagi;
}

test('without appetite, eating is as it always was', () => {
  species();
  APPETITE.enabled = 0;
  const fagi = sickFagi();
  assert.equal(canEat(fagi, 'red-round-sour'), true);
  assert.equal(aversive(fagi, 'green-drop-sour'), false);
  assert.equal(uselessNow(fagi, 'green-drop-sour'), false);
  registerSpecies([]);
});

test('a bite takes time, and a bad one puts her off all but what she knows is good', () => {
  species();
  APPETITE.enabled = 1;
  const fagi = createFagi();
  fagi.hunger = 40;
  eat(fagi, 'blue-crystal-sweet');
  assert.equal(canEat(fagi, 'blue-crystal-sweet'), false, 'still chewing');
  fagi.age += APPETITE.handling;
  assert.equal(canEat(fagi, 'blue-crystal-sweet'), true);

  eat(fagi, 'red-orb-musky');   // sick
  fagi.age += APPETITE.handling;
  assert.equal(canEat(fagi, 'blue-crystal-sweet'), true, 'known good still goes down');
  assert.equal(canEat(fagi, 'green-drop-sour'), false, 'nothing new while sick');
  fagi.age += APPETITE.malaise;
  assert.equal(canEat(fagi, 'green-drop-sour'), true, 'the malaise passes; sour never hurt her');
  APPETITE.enabled = 0;
  registerSpecies([]);
});

test('one bad bite is enough to put her off the smell, not the color', () => {
  species();
  APPETITE.enabled = 1;
  const fagi = sickFagi();
  fagi.age += APPETITE.malaise + APPETITE.handling;
  assert.equal(aversive(fagi, 'red-round-sour'), true, 'what she tasted and found bad');
  assert.equal(aversive(fagi, 'green-drop-sour'), true, 'another fruit with the same smell');
  assert.equal(aversive(fagi, 'red-orb-musky'), false, 'the same color does not put her off');
  assert.equal(canEat(fagi, 'green-drop-sour'), false);
  fagi.hunger = HUNGER.max * APPETITE.desperate;
  assert.equal(canEat(fagi, 'green-drop-sour'), true, 'desperate hunger eats it anyway');
  APPETITE.enabled = 0;
  registerSpecies([]);
});

test('she does not pick up, nor chase, food she cannot eat while hungry', () => {
  species();
  APPETITE.enabled = 1;
  const world = createWorld();
  const fagi = sickFagi();
  fagi.age += APPETITE.handling;
  fagi.hunger = 70;
  const p = addPoint(world, fagi.x, fagi.y, 'green-drop-sour');
  fagi.target = p;
  tryPickOrEat(fagi, world);
  assert.equal(world.points.length, 1, 'left where it was');
  assert.equal(fagi.carrying, null);
  assert.equal(fagi.target, null);
  assert.equal(uselessNow(fagi, 'green-drop-sour'), true, 'so pursue skips it');
  APPETITE.enabled = 0;
  registerSpecies([]);
});

test('the pantry only calls her if there is something she can eat there', () => {
  species();
  APPETITE.enabled = 1;
  const fagi = sickFagi();
  fagi.age += APPETITE.malaise + APPETITE.handling;
  fagi.pantry = { 'green-drop-sour': 3 };
  const ctx = { nest: { x: 0, y: 0 }, inNest: false, hungerU: 0.7 };
  assert.equal(pantryIntent(fagi, ctx), null, 'nothing there she would eat');
  fagi.pantry['blue-crystal-sweet'] = 1;
  assert.equal(pantryIntent(fagi, ctx)?.action, 'pantry');
  APPETITE.enabled = 0;
  registerSpecies([]);
});

test('a death the poison brought about is called poisoning', () => {
  species();
  APPETITE.enabled = 1;
  const fagi = createFagi();
  fagi.hunger = 70;
  eat(fagi, 'red-round-sour');
  fagi.age += 30;
  fagi.hunger = HUNGER.max;
  assert.equal(resolveVitalFailure(fagi), true);
  assert.equal(fagi.cause, 'poison');

  const starved = createFagi();
  starved.hunger = HUNGER.max;
  resolveVitalFailure(starved);
  assert.equal(starved.cause, 'hunger');
  APPETITE.enabled = 0;
  registerSpecies([]);
});

test('thirsty and not knowing where water is, she stops gathering to look for it', () => {
  APPETITE.enabled = 1;
  const fagi = createFagi();
  const ctx = { thirstU: APPETITE.searchWater + 0.05, hungerU: 0.1, pool: null, ranked: [], nest: { x: 0, y: 0 }, inNest: false };
  assert.equal(thirstSearch(fagi, null, ctx)?.action, 'searchWaterNearHome');
  assert.equal(thirstSearch(fagi, null, { ...ctx, pool: { x: 1, y: 1 } }), null, 'she knows where it is');
  assert.equal(thirstSearch(fagi, null, { ...ctx, thirstU: 0.1 }), null, 'not thirsty enough');
  fagi.carrying = { type: 'nectar' };
  assert.equal(thirstSearch(fagi, null, ctx), null, 'she takes her load home first');
  APPETITE.enabled = 0;
  assert.equal(thirstSearch(createFagi(), null, ctx), null, 'off by default');
  assert.ok(THIRST.max > 0);
});
