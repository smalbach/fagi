import test from 'node:test';
import assert from 'node:assert/strict';

import { createFagi } from '../src/fagi.js';
import { HABITS, CARRY, NEEDS, NEST, HUNGER, THIRST } from '../src/config.js';
import { habit, move, observeHabits, storedHarm, spoiledRations, deathLesson, habitsSnapshot, restoreHabits } from '../src/habits.js';
import { registerSpecies } from '../src/chemistry.js';

test('a habit that never moved reads the factory value', () => {
  const fagi = createFagi();
  assert.equal(habit(fagi, 'tasteAt'), CARRY.eatBelow);
  assert.equal(habit(fagi, 'hungerAt'), NEEDS.critical);
  assert.equal(habit(fagi, 'reserve'), NEST.full);
});

test('a hunger scare makes her go for food sooner, once per scare', () => {
  const fagi = createFagi();
  fagi.hunger = HUNGER.max * 0.9;
  observeHabits(fagi, { stored: 3, edible: 3 });
  assert.equal(habit(fagi, 'hungerAt'), 0.45);
  observeHabits(fagi, { stored: 3, edible: 3 });
  assert.equal(habit(fagi, 'hungerAt'), 0.45, 'the same scare does not count twice');
  assert.equal(habit(fagi, 'reserve'), NEST.full, 'there was food in the pantry: the reserve was not the problem');
  assert.equal(fagi.brain.lastHabit.id, 'hungerAt');
  assert.equal(fagi.brain.lastHabit.why.key, 'habit.why.hunger');

  fagi.hunger = 10;
  observeHabits(fagi, { stored: 3, edible: 3 });
  fagi.hunger = HUNGER.max * 0.9;
  observeHabits(fagi, { stored: 0, edible: 0 });
  assert.equal(habit(fagi, 'hungerAt'), 0.35, 'a second scare, another rung');
});

test('a scare with an empty pantry asks for a bigger reserve; one full of poison does not', () => {
  const fagi = createFagi();
  fagi.pantryAt = 5;
  fagi.hunger = HUNGER.max * 0.9;
  observeHabits(fagi, { stored: 0, edible: 0 });
  assert.equal(habit(fagi, 'reserve'), 18);
  const other = createFagi();
  other.pantryAt = 5;
  other.hunger = HUNGER.max * 0.9;
  observeHabits(other, { stored: 12, edible: 0 });
  assert.equal(habit(other, 'reserve'), NEST.full, 'the lesson there is to taste first, not to store more');
});

test('thirst and exhaustion teach their own habits', () => {
  const fagi = createFagi();
  fagi.thirst = THIRST.max * 0.9;
  fagi.energy = 0;
  observeHabits(fagi, { stored: 5, edible: 5 });
  assert.equal(habit(fagi, 'thirstAt'), 0.45);
  assert.equal(habit(fagi, 'restAt'), 35);
});

test('a long calm relaxes a habit she had tightened, one rung', () => {
  const fagi = createFagi();
  fagi.hunger = HUNGER.max * 0.9;
  observeHabits(fagi, { stored: 5, edible: 5 });
  fagi.hunger = 10;
  fagi.age += HABITS.calm + 1;
  observeHabits(fagi, { stored: 5, edible: 5 });
  assert.equal(habit(fagi, 'hungerAt'), 0.55);
  assert.equal(fagi.brain.lastHabit.dir, 'bolder');
});

test('storing something harmful teaches her to taste before storing', () => {
  const fagi = createFagi();
  storedHarm(fagi, 'toxic', true, -0.7);
  assert.equal(habit(fagi, 'tasteAt'), 30);
  storedHarm(fagi, 'toxic', false, -0.7);
  assert.equal(habit(fagi, 'tasteAt'), 30, 'only a first bite says she stored it untasted');
});

test('with tasteAt learned, she eats an untasted fruit instead of carrying it', async () => {
  const { tryPickOrEat } = await import('../src/feeding.js');
  registerSpecies([{ key: 'red-drop-sour', spec: { color: '#fff', radius: 6, aroma: 130, life: 200, hunger: 25, effects: [], traits: { color: 'red', shape: 'drop', smell: 'sour' }, painter: 'berry', species: true } }]);
  const world = { points: [], objects: [], width: 1000, height: 1000, time: 0 };
  const run = (fagi) => {
    const p = { x: fagi.x, y: fagi.y, type: 'red-drop-sour', age: 0, id: 1 };
    world.points = [p];
    fagi.target = p;
    fagi.hunger = 20;
    tryPickOrEat(fagi, world);
    return { ate: fagi.eaten, carrying: fagi.carrying?.type ?? null };
  };
  assert.deepEqual(run(createFagi()), { ate: 0, carrying: 'red-drop-sour' }, 'factory: not hungry, she carries it home');
  const careful = createFagi();
  move(careful, 'tasteAt', 'safer', { key: 'x' });
  move(careful, 'tasteAt', 'safer', { key: 'x' });
  assert.deepEqual(run(careful), { ate: 1, carrying: null }, 'she tastes it first');
  registerSpecies([]);
});

test('spoiled rations make the reserve smaller; dying of hunger makes food come sooner', () => {
  const fagi = createFagi();
  spoiledRations(fagi, 2);
  assert.equal(habit(fagi, 'reserve'), 6);
  deathLesson(fagi, 'hunger', { stored: 3, edible: 3 });
  assert.equal(habit(fagi, 'hungerAt'), 0.45);
});

test('with habits off, or learning off, nothing moves', () => {
  const fagi = createFagi();
  HABITS.learn = 0;
  try {
    assert.equal(move(fagi, 'hungerAt', 'safer', { key: 'x' }), null);
    assert.equal(habit(fagi, 'hungerAt'), NEEDS.critical);
  } finally { HABITS.learn = 1; }
  move(fagi, 'hungerAt', 'safer', { key: 'x' });
  HABITS.enabled = 0;
  try {
    assert.equal(habit(fagi, 'hungerAt'), NEEDS.critical, 'off reads the factory value even after a move');
  } finally { HABITS.enabled = 1; }
});

test('habits survive a snapshot, export and import; malformed ones are ignored', async () => {
  const store = await import('../src/learned/store.js');
  const fagi = createFagi();
  move(fagi, 'hungerAt', 'safer', { key: 'habit.why.hunger', params: { v: 88 } });
  spoiledRations(fagi, 1);
  const snap = habitsSnapshot(fagi.brain.habits);
  assert.deepEqual(Object.keys(snap).sort(), ['hungerAt', 'reserve']);
  const other = createFagi();
  store.importText(other, store.exportText(fagi));
  assert.equal(habit(other, 'hungerAt'), 0.45);
  assert.equal(habit(other, 'reserve'), 6);
  assert.equal(other.brain.habits.hungerAt.moves.length, 1);
  const bad = restoreHabits({ hungerAt: { rung: 99 }, nonsense: { rung: 1 }, restAt: { rung: 2, moves: 'x' } });
  assert.equal(bad.hungerAt.rung, null);
  assert.equal(bad.restAt.rung, 2);
  assert.deepEqual(bad.restAt.moves, []);
});
