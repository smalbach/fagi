import test from 'node:test';
import assert from 'node:assert/strict';

import { createFagi } from '../src/fagi.js';
import { eat } from '../src/feeding.js';
import { activeRule, verdict } from '../src/learned/rules.js';
import { pass } from '../src/social.js';
import { teach } from '../src/generations.js';
import { rule } from '../src/learned/dsl.js';
import { recall } from '../src/memory.js';
import {
  createChemistry, changeChemistry, invertChemistry, feedOf, createSpecies, registerSpecies,
  speciesUnder, TRAITS,
} from '../src/chemistry.js';
import { GEN, SOCIAL } from '../src/config.js';

function seeded(s) {
  let x = s >>> 0;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
}

const sisters = (n) => Array.from({ length: n }, (_, i) => Object.assign(createFagi(), { id: i + 1 }));

// --- chemistry --------------------------------------------------------------

test('a rules-based chemistry decides by clauses, on any dimension', () => {
  const chem = createChemistry(seeded(1), { family: 'one', dim: 'color' });
  const [poison] = chem.rules.poison[0];
  const [food] = chem.rules.food[0];
  assert.match(poison, /^color:/);
  const withColor = (c) => ({ color: c.split(':')[1], shape: 'round', smell: 'sweet' });
  assert.equal(feedOf(chem, withColor(poison)), 'poison');
  assert.equal(feedOf(chem, withColor(food)), 'nourishing');
});

test('a conjunctive poison needs both traits; the smell alone is mild', () => {
  const chem = createChemistry(seeded(2), { family: 'conj' });
  const [color, smell] = chem.rules.poison[0].map((c) => c.split(':')[1]);
  const other = TRAITS.color.find((c) => c !== color);
  assert.equal(feedOf(chem, { color, shape: 'orb', smell }), 'poison');
  assert.equal(feedOf(chem, { color: other, shape: 'orb', smell }), 'mild');
});

test('rules-based species still come with two poisons and two foods', () => {
  for (const family of ['one', 'conj']) {
    const chem = createChemistry(seeded(3), { family });
    const feeds = createSpecies(chem, 8, seeded(4)).map(({ spec }) => feedOf(chem, spec.traits));
    assert.ok(feeds.filter((f) => f === 'poison').length >= 2, family);
    assert.ok(feeds.filter((f) => f === 'nourishing').length >= 2, family);
  }
});

test('the world changes three ways: invert, rotate within a dimension, shift to another', () => {
  const chem = createChemistry(seeded(5), { family: 'one' });
  assert.deepEqual(invertChemistry(chem).rules, { poison: chem.rules.food, food: chem.rules.poison });

  const rot = changeChemistry(chem, 'rotate', seeded(6));
  const [was] = chem.rules.poison[0];
  const [now] = rot.rules.poison[0];
  assert.notEqual(now, was);
  assert.equal(now.split(':')[0], was.split(':')[0], 'same dimension');
  assert.notEqual(now, chem.rules.food[0][0], 'not the food');
  assert.deepEqual(rot.rules.food, chem.rules.food);

  const shifted = changeChemistry(chem, 'shift', seeded(7));
  assert.notEqual(shifted.rules.poison[0][0].split(':')[0], 'smell', 'another dimension');
});

test('the same species under a new chemistry does something else', () => {
  const chem = createChemistry(seeded(8), { family: 'one' });
  const smell = chem.rules.poison[0][0].split(':')[1];
  const traits = { color: 'red', shape: 'drop', smell };
  assert.ok(speciesUnder(chem, traits).spec.hunger > 0);
  assert.ok(speciesUnder(invertChemistry(chem), traits).spec.hunger < 0);
});

// --- transmission formats ---------------------------------------------------

const SOUR = ['red-drop-sour', 'blue-orb-sour', 'green-round-sour'];
function species() {
  const chem = { smell: { sour: 'poison', sweet: 'nourishing', musky: 'mild', sharp: 'mild' }, color: {} };
  registerSpecies(SOUR.map((k) => {
    const [color, shape, smell] = k.split('-');
    return speciesUnder(chem, { color, shape, smell });
  }));
}

// A giver who tasted the first sour fruit and holds a rule about sour things.
function giver() {
  const [a] = sisters(1);
  a.hunger = 50;
  eat(a, SOUR[0]);
  a.episode = null;
  a.brain.rules.list.push(rule('avoid-smell-sour', {
    on: ['eat', 'store', 'pursue'], when: { all: ['smell:sour'] }, verdict: 'avoid', weight: -0.6,
    because: [{ sense: 'hunger', v: 25 }], learnedAt: 3, tries: 2, stage: 'short',
  }));
  return a;
}

function withFormat(format, fn) {
  const was = SOCIAL.format;
  SOCIAL.format = format;
  try { return fn(); } finally { SOCIAL.format = was; }
}

test('a conclusion is about a fruit the teller knows, and nothing else', () => {
  species();
  const a = giver();
  recall(a.brain, SOUR[1]);   // she has met the second, never tasted it
  const [, b] = [a, ...sisters(2).slice(1)];
  const got = withFormat('verdict', () => pass(a, b, 10, { kind: 'told', scale: SOCIAL.trust }));
  const ids = got.map((g) => g.id).sort();
  assert.deepEqual(ids, [`avoid-${SOUR[0]}`, `avoid-${SOUR[1]}`].sort());
  assert.equal(verdict(b, 'eat', SOUR[2]), null, 'a fruit nobody told her about');
  assert.equal(verdict(a, 'eat', SOUR[2]), 'avoid', 'the reason covers it');
  const r = activeRule(b.brain.rules, SOUR[1], 'avoid');
  assert.equal(r.source.kind, 'told');
  assert.equal(r.cases, undefined);
  registerSpecies([]);
});

test('a reason covers fruit neither of them has met', () => {
  species();
  const a = giver();
  const b = sisters(2)[1];
  withFormat('rule', () => pass(a, b, 10, { kind: 'told', scale: SOCIAL.trust }));
  assert.equal(verdict(b, 'eat', SOUR[2]), 'avoid');
  registerSpecies([]);
});

test('with evidence she also hears the bites behind the reason, as if she had seen them', () => {
  species();
  const a = giver();
  const b = sisters(2)[1];
  const got = withFormat('evidence', () => pass(a, b, 10, { kind: 'told', scale: SOCIAL.trust }));
  assert.ok(got.some((g) => g.kind === 'bite' && g.key === SOUR[0]));
  assert.ok(b.brain.facts[SOUR[0]].value < 0, 'she learned it went badly');
  assert.equal(b.brain.facts[SOUR[0]].tries, 0, 'without tasting it');
  registerSpecies([]);
});

test('a budget caps the items, strongest first', () => {
  species();
  const a = giver();
  const b = sisters(2)[1];
  const got = withFormat('evidence', () => pass(a, b, 10, { kind: 'told', scale: SOCIAL.trust, budget: 1 }));
  assert.equal(got.length, 1);
  registerSpecies([]);
});

test('a belief keeps its origin from copy to copy, told or taught', () => {
  species();
  const a = giver();
  const [, b, c] = sisters(3);
  pass(a, b, 10, { kind: 'told', scale: 1 });
  const wasGen = GEN.cultureTrust;
  GEN.cultureTrust = 1;
  try { teach(c, b); } finally { GEN.cultureTrust = wasGen; }
  const origin = activeRule(c.brain.rules, 'smell:sour', 'avoid').origin;
  assert.equal(origin, '1/avoid-smell-sour@3');
  assert.equal(activeRule(c.brain.rules, 'smell:sour', 'avoid').source.from, 2);
  registerSpecies([]);
});
