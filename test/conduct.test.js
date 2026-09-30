import test from 'node:test';
import assert from 'node:assert/strict';

import { CONDUCT, DECIDE } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { conduct, renderConduct, parseConduct, noteMeal, ruling, conductOf, grammarSize, knownOf } from '../src/learned/conduct.js';
import { enableOrganism } from '../src/organism.js';
import { set, runEpisode } from '../research/adaptive-decision/episode.js';
import { FOOD, GROUPS } from '../research/adaptive-decision/design.js';

const life = { weight: 0.5, tries: 1, stage: 'short', learnedAt: 10, source: 'self' };

function withConduct(settings, fn) {
  const saved = { ...CONDUCT, born: [...CONDUCT.born] };
  Object.assign(CONDUCT, settings);
  try { return fn(); } finally { Object.assign(CONDUCT, saved); }
}

test('a well-formed line of conduct passes, and prints and reads back the same', () => {
  const r = conduct('taste-novel', { if: { novel: true, hungerBelow: 75 }, do: 'taste', ...life });
  const line = renderConduct(r);
  assert.match(line, /^conduct\('taste-novel', \{.*\}\);$/);
  assert.deepEqual(parseConduct(line), r);
});

test('what the grammar cannot say is refused with a reason', () => {
  const bad = (cond, act = 'leave', extra = {}) => () => conduct('x', { if: cond, do: act, ...life, ...extra });
  assert.throws(bad({ novel: true, harmed: true }), /never eaten/);
  assert.throws(bad({ hungerBelow: 50 }), /one of/);
  assert.throws(bad({ hungerFrom: 75, hungerBelow: 60 }), /no hunger is both/);
  assert.throws(bad({}), /must say something/);
  assert.throws(bad({ novel: true }, 'fly'), /"do"/);
  assert.throws(bad({ novel: true }, 'leave', { code: 'eval()' }), /unknown fields/);
  assert.throws(bad({ traits: ['taste:bitter'] }), /malformed trait/);
});

test('the grammar is small, and its size is counted', () => {
  assert.equal(grammarSize(0), 4 * 15 * 4 - 4);
  assert.ok(grammarSize(6) > grammarSize(0));
});

test('her record of a kind comes from the bites she felt, and rules speak by precedence', () => withConduct({ enabled: 1, born: [
  { id: 'taste-novel', if: { novel: true, hungerBelow: 75 }, do: 'taste' },
  { id: 'leave-harmed-mostly', if: { harmedMostly: true }, do: 'leave' },
] }, () => {
  const fagi = createFagi();
  fagi.hunger = 50;
  assert.equal(conductOf(fagi).list.length, 2);
  assert.equal(ruling(fagi, 'nectar').do, 'taste');
  noteMeal(fagi, { key: 'nectar', portion: 0.25, before: 50, after: 45 });
  assert.equal(ruling(fagi, 'nectar'), null);
  noteMeal(fagi, { key: 'nectar', portion: 1, before: 40, after: 65 });
  assert.deepEqual(knownOf(fagi, 'nectar'), { bites: 2, harms: 1, fed: 1 });
  assert.equal(ruling(fagi, 'nectar').do, 'leave');
  const meal = conductOf(fagi).meals[1];
  assert.equal(meal.novel, false);
  assert.equal(meal.harmed, true);
  fagi.hunger = 80;
  assert.equal(ruling(fagi, 'toxic'), null);   // new, but too hungry for the trial-bite rule
}));

test("with no rule of conduct, the 'learned' judge is her usual judgment", () => {
  enableOrganism();
  set(FOOD);
  const g = GROUPS.dev2;
  try {
    set({ 'DECIDE.eat': 'current' });
    const plain = runEpisode({ seed: g.seed, mapSeed: g.map(0), horizon: 600 });
    set({ 'DECIDE.eat': 'learned', 'CONDUCT.enabled': 1 });
    const learned = runEpisode({ seed: g.seed, mapSeed: g.map(0), horizon: 600 });
    assert.equal(learned.fingerprint, plain.fingerprint);
  } finally { DECIDE.eat = null; DECIDE.enabled = 0; CONDUCT.enabled = 0; }
});
