import test from 'node:test';
import assert from 'node:assert/strict';

import { TASTE, HUNGER, NEEDS, POINT_TYPES } from '../src/config.js';
import { createChemistry, createSpecies, registerSpecies, tasteCuesOf, TASTES, feedOf } from '../src/chemistry.js';
import { createFagi } from '../src/fagi.js';
import { eat } from '../src/feeding.js';
import { atMouth, innateLiking, liking } from '../src/taste.js';
import { learn } from '../src/brain.js';
import { rng } from '../scripts/batch/random.js';

function tasteWorld(seed = 3, n = 6) {
  TASTE.enabled = 1;
  const r = rng(seed);
  const chem = createChemistry(r);
  const species = createSpecies(chem, n, r);
  registerSpecies(species);
  return { chem, species };
}
const off = () => { registerSpecies([]); TASTE.enabled = 0; };

test('with TASTE off the chemistry is the old one: the smell decides', () => {
  const chem = createChemistry(rng(1));
  assert.ok(chem.smell && !chem.taste);
});

test('a species is a hidden mix the tongue reads as tastes; what it does comes from the mix', () => {
  let bitter = 0; let bitterToxic = 0; let sweetSmell = 0; let sweet = 0;
  for (let s = 1; s <= 40; s++) {
    const { chem, species } = tasteWorld(s, 8);
    assert.ok(species.filter((x) => x.spec.hunger > 0).length >= 2, 'at least two poisons');
    assert.ok(species.filter((x) => feedOf(chem, x.spec.traits) === 'nourishing').length >= 2);
    for (const { key, spec } of species) {
      for (const t of Object.keys(spec.taste)) assert.ok(TASTES.includes(t));
      assert.ok(tasteCuesOf(key).every((c) => c.startsWith('taste:')));
      if ((spec.taste.bitter ?? 0) >= 0.3) { bitter++; if (spec.hunger > 0) bitterToxic++; }
      const dominant = Object.entries(spec.taste).sort((a, b) => b[1] - a[1])[0][0];
      if (dominant === 'sweet') { sweet++; if (spec.traits.smell === 'sweet') sweetSmell++; }
    }
    off();
  }
  assert.ok(bitterToxic / bitter > 0.5 && bitterToxic < bitter, 'bitter is mostly, not always, poison');
  assert.ok(sweetSmell / sweet > 0.5, 'what is sweet mostly smells sweet');
});

test('at the mouth she spits out what she dislikes, unless starving or she knows it is good', () => {
  TASTE.enabled = 1;
  POINT_TYPES.test_bitter = { color: '#888', radius: 6, aroma: 100, life: 100, hunger: -20, effects: [], taste: { bitter: 0.9 }, traits: { color: 'red', shape: 'drop', smell: 'musky' } };
  const fagi = createFagi();
  assert.ok(innateLiking('test_bitter') < TASTE.spitBelow);
  assert.equal(atMouth(fagi, 'test_bitter', 1).spat, true);
  assert.equal(atMouth(fagi, 'test_bitter', 0.25).spat, false, 'a trial bite is already small');
  fagi.hunger = HUNGER.max * NEEDS.critical;
  assert.equal(atMouth(fagi, 'test_bitter', 1).spat, false, 'need beats disgust');
  fagi.hunger = 0;
  learn(fagi.brain, 'test_bitter', 0.8, 10);
  assert.equal(atMouth(fagi, 'test_bitter', 1).spat, false, 'an acquired taste');
  const other = createFagi();
  eat(other, 'test_bitter');
  assert.equal(other.lastSpit?.key, 'test_bitter');
  assert.equal(other.lastEpisode.portion, TASTE.spitPortion);
  assert.ok(other.lastEpisode.sensations.some((s) => s.sense === 'taste' && s.v < 0));
  delete POINT_TYPES.test_bitter;
  TASTE.enabled = 0;
});

test('what a taste led to overrides her innate liking, and tastes take the blame readily', () => {
  TASTE.enabled = 1;
  POINT_TYPES.test_a = { color: '#888', radius: 6, aroma: 100, life: 100, hunger: -30, effects: [], taste: { spicy: 0.9 }, traits: { color: 'red', shape: 'drop', smell: 'sharp' } };
  POINT_TYPES.test_b = { color: '#888', radius: 6, aroma: 100, life: 100, hunger: -30, effects: [], taste: { spicy: 0.8 }, traits: { color: 'blue', shape: 'orb', smell: 'sharp' } };
  const fagi = createFagi();
  const before = liking(fagi, 'test_b');
  for (let i = 0; i < 4; i++) learn(fagi.brain, 'test_a', 0.9, 10 + i * 20);
  assert.ok(liking(fagi, 'test_b') > before, 'a new spicy fruit is liked better');
  assert.ok(Math.abs(fagi.brain.cues['taste:spicy'].w) > Math.abs(fagi.brain.cues['color:red'].w));
  delete POINT_TYPES.test_a; delete POINT_TYPES.test_b;
  TASTE.enabled = 0;
});

test('salt makes her thirsty', () => {
  TASTE.enabled = 1;
  POINT_TYPES.test_salt = { color: '#888', radius: 6, aroma: 100, life: 100, hunger: -20, thirst: 12, effects: [], taste: { salty: 0.9 }, traits: { color: 'red', shape: 'drop', smell: 'musky' } };
  const fagi = createFagi();
  eat(fagi, 'test_salt');
  assert.equal(fagi.thirst, 12);
  delete POINT_TYPES.test_salt;
  TASTE.enabled = 0;
});
