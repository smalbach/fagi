import test from 'node:test';
import assert from 'node:assert/strict';

import { LARDER, HABITS, HUNGER } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { useNest } from '../src/nest.js';
import { addObject, createWorld, storeInNest, takeFromNest, stockCount } from '../src/world.js';
import { pantryEstimate, larderSummary, roomAtHome } from '../src/larder.js';
import { habit } from '../src/habits.js';
import { invalidEvent } from '../src/recorder/events.js';

// LARDER on for one test, and back to how it was even if the test fails.
function withLarder(fn) {
  const saved = { larder: { ...LARDER }, habits: { ...HABITS } };
  LARDER.enabled = 1;
  try { fn(); } finally { Object.assign(LARDER, saved.larder); Object.assign(HABITS, saved.habits); }
}

function home(rations = 0) {
  const world = createWorld();
  world.rain.timer = Infinity;
  const fagi = createFagi();
  const nest = addObject(world, fagi.x, fagi.y, 'nest');
  for (let i = 0; i < rations; i++) storeInNest(nest, 'nectar');
  return { world, fagi, nest };
}

// She goes out for `seconds` and comes back.
function away(fagi, nest, seconds) {
  fagi.x = nest.x + 500;
  fagi.age += seconds;
}
const back = (fagi, world, nest) => { fagi.x = nest.x; fagi.y = nest.y; useNest(fagi, world); };

test('loaded to a full nest and not hungry, she leaves her load at the door and lowers her reserve', () => withLarder(() => {
  HABITS.enabled = 1;
  const { world, fagi, nest } = home(LARDER.capacity);
  const reserve = habit(fagi, 'reserve');
  fagi.hunger = 0;
  fagi.carrying = { type: 'nectar', age: 12 };
  useNest(fagi, world);
  assert.equal(fagi.carrying, null);
  assert.equal(stockCount(nest.stock), LARDER.capacity, 'nothing more fits');
  const left = world.points.find((p) => p.from === 'nest');
  assert.ok(left, 'at the door');
  assert.equal(left.age, 12, 'it keeps its age');
  assert.ok(Math.hypot(left.x - nest.x, left.y - nest.y) > 0);
  assert.equal(fagi.lastNestFull.did, 'dropped');
  assert.ok(habit(fagi, 'reserve') < reserve, 'she will store less');
}));

test('loaded to a full nest and hungry, she eats what she carried', () => withLarder(() => {
  const { world, fagi } = home(LARDER.capacity);
  fagi.hunger = HUNGER.max * 0.6;
  const before = fagi.hunger;
  fagi.carrying = { type: 'nectar', age: 0 };
  useNest(fagi, world);
  assert.equal(fagi.carrying, null);
  assert.equal(fagi.lastNestFull.did, 'ate');
  assert.ok(fagi.hunger < before);
  assert.equal(world.points.length, 0);
}));

test('a nest full of what she avoids: she carries one out and stores hers', () => withLarder(() => {
  const { world, fagi, nest } = home(0);
  for (let i = 0; i < LARDER.capacity; i++) storeInNest(nest, 'toxic');
  fagi.brain.rules.list.push({ id: 'r1', on: ['eat'], when: { key: 'toxic' }, verdict: 'avoid', weight: -1 });
  fagi.carrying = { type: 'nectar', age: 0 };
  useNest(fagi, world);
  assert.equal(fagi.lastNestFull?.did, 'cleared');
  assert.equal(nest.stock.nectar, 1, 'hers is in');
  assert.equal(nest.stock.toxic, LARDER.capacity - 1, 'one refuse out');
  assert.equal(world.points.find((p) => p.from === 'nest')?.type, 'toxic', 'at the door');
}));

test('a nest found full of good food: she does not haul food home while she predicts it that full', () => withLarder(() => {
  LARDER.learn = 0;
  const { world, fagi, nest } = home(LARDER.capacity);
  fagi.hunger = 0;
  fagi.carrying = { type: 'nectar', age: 0 };
  useNest(fagi, world);
  assert.equal(roomAtHome(fagi), false);
  for (let i = 0; i < 5; i++) takeFromNest(nest, 'nectar');
  away(fagi, nest, 30);
  assert.equal(roomAtHome(fagi), false, 'she has not seen it empty since');
  back(fagi, world, nest);
  assert.equal(roomAtHome(fagi), true, 'she saw room');
}));

test('with room, she stores as before', () => withLarder(() => {
  const { world, fagi, nest } = home(3);
  fagi.carrying = { type: 'nectar', age: 0 };
  useNest(fagi, world);
  assert.equal(stockCount(nest.stock), 4);
  assert.equal(fagi.lastNestFull, undefined);
}));

test('between visits she predicts the pantry, and each visit corrects how fast she thinks it empties', () => withLarder(() => {
  const { world, fagi, nest } = home(10);
  fagi.hunger = 0;
  back(fagi, world, nest);
  assert.equal(pantryEstimate(fagi), 10);
  away(fagi, nest, 100);
  const guess = pantryEstimate(fagi);
  assert.ok(guess < 10, `she expects it to have gone down: ${guess}`);

  // It emptied much faster than she thought: 8 rations in 100 s.
  for (let i = 0; i < 8; i++) takeFromNest(nest, 'nectar');
  const rate0 = fagi.brain.larder?.rate ?? LARDER.prior;
  back(fagi, world, nest);
  const l = fagi.brain.larder;
  assert.ok(l.rate > rate0, 'she now thinks it empties faster');
  assert.ok(l.surprise < 0, 'emptier than she thought');

  // Her sisters fill it while she is away: the rate can turn negative.
  for (let k = 0; k < 6; k++) {
    away(fagi, nest, 60);
    for (let i = 0; i < 3; i++) storeInNest(nest, 'nectar');
    back(fagi, world, nest);
  }
  assert.ok(fagi.brain.larder.rate < 0, `it fills on its own: ${fagi.brain.larder.rate}`);
  away(fagi, nest, 30);
  assert.ok(pantryEstimate(fagi) > stockCount(fagi.pantry) - 0.001, 'she expects it fuller than she left it');
  assert.ok(pantryEstimate(fagi) <= LARDER.capacity);
  assert.equal(larderSummary(fagi).visits, 7);
}));

test('with learning off she keeps the last look', () => withLarder(() => {
  LARDER.learn = 0;
  const { world, fagi, nest } = home(10);
  back(fagi, world, nest);
  away(fagi, nest, 500);
  assert.equal(pantryEstimate(fagi), 10);
}));

test('with LARDER off the nest takes all she brings and the pantry is the last look', () => {
  const { world, fagi, nest } = home(40);
  fagi.carrying = { type: 'nectar', age: 0 };
  useNest(fagi, world);
  assert.equal(stockCount(nest.stock), 41);
  away(fagi, nest, 500);
  assert.equal(pantryEstimate(fagi), 41);
  assert.equal(fagi.brain.larder, undefined);
});

test('the new event is valid for the recorder', () => {
  assert.equal(invalidEvent({ seq: 0, t: 1, type: 'nest_full', what: 'nectar', did: 'dropped' }), null);
});
