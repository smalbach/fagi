import test from 'node:test';
import assert from 'node:assert/strict';

import { PERCEPT, POINT_TYPES, BACKEND } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { learn, evaluate } from '../src/brain.js';
import { verdict, upsertRule } from '../src/learned/rules.js';
import { perceivedCues } from '../src/learned/cues.js';
import { createChemistry, createSpecies, registerSpecies, speciesKey } from '../src/chemistry.js';
import { sameScent, lookOf, unnamed } from '../src/percept.js';
import { observe } from '../src/observation.js';
import { perceive } from '../src/perception.js';
import { createWorld } from '../src/world.js';
import { registerFruits, keyOf, blankFruit } from '../src/custom-fruits.js';

function seeded(s) {
  let x = s >>> 0;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
}

test('no two fruit types look alike: telling them apart by sight is fair', () => {
  PERCEPT.enabled = 1;
  for (const family of ['smell', 'one', 'conj']) {
    for (let seed = 1; seed <= 20; seed++) {
      const rnd = seeded(seed);
      registerSpecies(createSpecies(createChemistry(rnd, { family }), 8, rnd));
      const looks = Object.values(POINT_TYPES).filter((s) => s.traits).map((s) => speciesKey(s.traits));
      assert.equal(new Set(looks).size, looks.length, `${family} ${seed}`);
    }
  }
  PERCEPT.enabled = 0;
  registerSpecies([]);
});

// A smelled nectar: she knows it smells sweet, not that it is nectar.
const smelled = (key) => ({ key, kind: 'food', via: 'smell', ref: {}, dist: 50, range: 100, urgency: 0.5, penalty: 0, cues: perceivedCues(key, 'smell') });

test('by smell alone she judges the smell, not her memory of the species', () => {
  const fagi = createFagi();
  for (let i = 0; i < 6; i++) learn(fagi.brain, 'nectar', 0.9, 10 + i * 20);
  fagi.brain.cues['smell:sweet'] = { w: -0.6, n: 5, lastAt: 0 };   // as if sweet had mostly harmed her
  PERCEPT.enabled = 0;
  const [before] = evaluate(fagi.brain, [smelled('nectar')]);
  PERCEPT.enabled = 1;
  const [after] = evaluate(fagi.brain, [smelled('nectar')]);
  assert.ok(before.parts.belief > 0, 'without PERCEPT she knew it was nectar');
  assert.ok(after.parts.belief < 0, 'with it, she only knows sweet has harmed her');
  assert.equal(after.value, 0);
  PERCEPT.enabled = 0;
});

test('rules about one species do not reach a fruit she only smells', () => {
  const fagi = createFagi();
  upsertRule(fagi.brain.rules, { id: 'avoid-toxic', on: ['eat', 'pursue', 'store'], when: { key: 'toxic' }, verdict: 'avoid', weight: -0.8, because: [], at: 0 });
  assert.equal(verdict(fagi, 'pursue', 'toxic'), 'avoid');
  assert.equal(verdict(fagi, 'pursue', 'toxic', { traits: ['smell:rotten'], blind: true }), null);
  upsertRule(fagi.brain.rules, { id: 'avoid-smell-rotten', on: ['eat', 'pursue', 'store'], when: { all: ['smell:rotten'] }, verdict: 'avoid', weight: -0.8, because: [], at: 0 });
  assert.equal(verdict(fagi, 'pursue', 'toxic', { traits: ['smell:rotten'], blind: true }), 'avoid', 'a rule about the smell does');
});

test('following a scent, she follows the smell, whatever gives it off', () => {
  // Two fruit made in the editor, different in every way but the smell.
  const a = { ...blankFruit('a'), id: 'musky1', color: '#b57bff', shape: 'orb', smell: 'musky' };
  const b = { ...blankFruit('b'), id: 'musky2', color: '#e8903d', shape: 'drop', smell: 'musky' };
  registerFruits([a, b]);
  PERCEPT.enabled = 0;
  assert.equal(sameScent(keyOf(a), keyOf(b)), false);
  PERCEPT.enabled = 1;
  assert.equal(sameScent(keyOf(a), keyOf(b)), true, 'both musky');
  assert.equal(sameScent(keyOf(a), 'nectar'), false);
  assert.equal(sameScent('water', 'water'), true);
  PERCEPT.enabled = 0;
  registerFruits([]);
});

test('the API reads what she perceives, never the names of the classic fruit', () => {
  PERCEPT.enabled = 1;
  BACKEND.enabled = 0;
  const fagi = createFagi();
  learn(fagi.brain, 'toxic', -0.9, 10);
  learn(fagi.brain, 'toxic', -0.9, 40);
  const world = createWorld();
  const { observation } = observe(fagi, world, perceive(fagi, world));
  const text = JSON.stringify(observation);
  for (const name of ['toxic', 'nectar', 'resin', 'spark']) assert.ok(!new RegExp(`\\b${name}\\b`).test(text), name);
  assert.ok(text.includes(lookOf('toxic')));
  assert.equal(unnamed('avoid-toxic'), `avoid-${lookOf('toxic')}`);
  PERCEPT.enabled = 0;
  assert.equal(unnamed('avoid-toxic'), 'avoid-toxic');
});
