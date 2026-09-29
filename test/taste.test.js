import test from 'node:test';
import assert from 'node:assert/strict';

import { TASTE, HUNGER, NEEDS, POINT_TYPES, LIFE, GEN, MAPGEN } from '../src/config.js';
import { createChemistry, createSpecies, registerSpecies, tasteCuesOf, TASTES, feedOf, invertChemistry, smellOf } from '../src/chemistry.js';
import { enableOrganism } from '../src/organism.js';
import { runLineage } from '../scripts/batch/generations.js';
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

test('a look-alike: the same look, another mix; only the tongue tells, and it tastes wrong', async () => {
  const { specOfFruit, drawVariant } = await import('../src/chemistry.js');
  const { tastesWrong } = await import('../src/taste.js');
  TASTE.enabled = 1;
  POINT_TYPES.test_mimic = {
    color: '#888', radius: 6, aroma: 100, life: 100, hunger: -30, effects: [], taste: { sweet: 0.9 },
    traits: { color: 'red', shape: 'drop', smell: 'sweet' },
    twin: { share: 1, hunger: 25, thirst: 0, burn: 0, effects: [{ stat: 'speed', mult: 0.6, sec: 5 }], taste: { bitter: 0.8 } },
  };
  assert.equal(drawVariant('test_mimic'), 'twin');
  assert.equal(specOfFruit('test_mimic', 'twin').hunger, 25);
  assert.equal(specOfFruit('test_mimic').hunger, -30);
  const fagi = createFagi();
  eat(fagi, 'test_mimic');                        // the good one: she learns it is good
  assert.ok(fagi.brain.facts.test_mimic.value > 0);
  assert.equal(tastesWrong(fagi, 'test_mimic', { bitter: 0.8 }), true);
  eat(fagi, 'test_mimic', { variant: 'twin' });   // same look, bitter: she spits it out
  assert.equal(fagi.lastSpit?.variant, 'twin');
  assert.ok(fagi.brain.cues['taste:bitter'].w < 0, 'what the bitter one did, the bitter taste learns');
  delete POINT_TYPES.test_mimic;
  TASTE.enabled = 0;
});

test('sodium runs out; short of it she likes salt more, a salty bite relieves her, and known salty food pulls', async () => {
  const { updateSodium, innateLiking: liked, saltUrge } = await import('../src/taste.js');
  TASTE.enabled = 1;
  POINT_TYPES.test_salty = { color: '#888', radius: 6, aroma: 100, life: 100, hunger: -10, thirst: 10, effects: [], taste: { salty: 0.9 }, traits: { color: 'red', shape: 'drop', smell: 'musky' } };
  const fagi = createFagi();
  updateSodium(fagi, 10);
  const full = liked('test_salty', null, fagi);
  fagi.sodium = 0.1;
  assert.ok(liked('test_salty', null, fagi) > full, 'salt appetite');
  assert.equal(saltUrge(fagi, 'test_salty'), 0, 'she cannot know it is salty by looking');
  eat(fagi, 'test_salty');
  assert.ok(fagi.sodium > 0.1);
  assert.ok(fagi.lastEpisode.sensations.some((s) => s.sense === 'salt'));
  fagi.sodium = 0.2;
  assert.ok(Math.abs(saltUrge(fagi, 'test_salty') - 0.8) < 1e-9);
  delete POINT_TYPES.test_salty;
  TASTE.enabled = 0;
});

test('the smell of the poison: the chemistry\'s own under smells, the one poisonous species mostly carry under tastes', () => {
  const smelly = createChemistry(rng(1));
  const p = smellOf(smelly, 'poison');
  assert.equal(smelly.smell[p], 'poison');
  assert.equal(smellOf(invertChemistry(smelly), 'nourishing'), p, 'turned upside down, the old poison smell feeds');

  const chem = { taste: true, color: {}, compositions: {}, twins: {}, inverted: false };
  const toxin = { taste: { bitter: 0.8 }, toxic: true };
  const food = { taste: { umami: 0.9 }, toxic: false };
  const add = (smell, shape, comp) => { chem.compositions[`red-${shape}-${smell}`] = comp; return { color: 'red', shape, smell }; };
  const catalogue = [
    add('sharp', 'round', toxin), add('sharp', 'drop', toxin), add('musky', 'crystal', toxin),
    add('sweet', 'round', food), add('sweet', 'drop', food),
  ];
  assert.equal(chem.smell, undefined, 'a taste chemistry has no smell rule');
  assert.equal(smellOf(chem, 'poison', catalogue), 'sharp');
  assert.equal(smellOf(chem, 'nourishing', catalogue), 'sweet');
  const upside = invertChemistry(chem);
  assert.equal(smellOf(upside, 'poison', catalogue), 'sweet');
  assert.equal(smellOf(upside, 'nourishing', catalogue), 'sharp');
  assert.equal(smellOf(chem, 'poison', []), null, 'no poisonous species, no poison smell');
});

test('generations run with the organism on, whose chemistry is tastes (§25.4)', () => {
  const saved = { life: LIFE.enabled, sexual: GEN.sexual, species: MAPGEN.species };
  enableOrganism();
  LIFE.enabled = 0; GEN.sexual = 1; MAPGEN.species = 6;
  try {
    const opts = { generations: 2, colony: 4, duration: 20, dt: 0.05, mapSeed: 1, switchAt: null };
    const rows = runLineage(opts, 1000);
    assert.ok(rows.length >= 1);
    for (const r of rows) {
      assert.ok(Number.isFinite(r.born.innatePoison) && Number.isFinite(r.born.innateFood));
      assert.ok(Number.isInteger(r.born.taughtAvoidPoison) && Number.isInteger(r.born.taughtAvoidFood));
    }
  } finally {
    enableOrganism(false);
    LIFE.enabled = saved.life; GEN.sexual = saved.sexual; MAPGEN.species = saved.species;
    registerSpecies([]);
  }
});
