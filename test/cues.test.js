import test from 'node:test';
import assert from 'node:assert/strict';

import { createCues, learnCues, predict, wariness } from '../src/learned/cues.js';
import { createChemistry, createSpecies, effectOf, registerSpecies, speciesKeys, isHarmful } from '../src/chemistry.js';
import { POINT_TYPES } from '../src/config.js';

// A seeded random, so the chemistry is the same on every run.
function seeded(s) {
  let x = s >>> 0;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
}

test('one bad fruit makes an untasted fruit with the same smell look bad', () => {
  const cues = createCues();
  learnCues(cues, ['color:red', 'shape:drop', 'smell:sour'], -1, 0);
  const sameSmell = predict(cues, ['color:blue', 'shape:orb', 'smell:sour']);
  const nothingShared = predict(cues, ['color:blue', 'shape:orb', 'smell:sweet']);
  assert.ok(sameSmell.value < -0.2, `same smell predicts harm (${sameSmell.value})`);
  assert.equal(nothingShared.value, 0);
  assert.ok(wariness(sameSmell) > wariness(nothingShared));
});

test('blocking: once sour is known to be bad, a sour red fruit teaches little about red', () => {
  const cues = createCues();
  for (let i = 0; i < 6; i++) learnCues(cues, ['smell:sour'], -1, i);
  learnCues(cues, ['smell:sour', 'color:red'], -1, 10);
  assert.ok(Math.abs(cues['color:red'].w) < 0.1, `red barely blamed (${cues['color:red'].w})`);
});

test('wrong blame is undone by a good fruit that shares the innocent trait', () => {
  const cues = createCues();
  learnCues(cues, ['color:red', 'smell:sour'], -1, 0);
  const blamed = cues['color:red'].w;
  for (let i = 1; i < 5; i++) learnCues(cues, ['color:red', 'smell:sweet'], 0.8, i);
  assert.ok(cues['color:red'].w > blamed, 'red recovers');
  assert.ok(predict(cues, ['color:red', 'smell:sour']).value < 0, 'red and sour together still look bad');
});

test('each map has a chemistry: species follow it and include both poison and food', () => {
  const rnd = seeded(7);
  const chem = createChemistry(rnd);
  const species = createSpecies(chem, 6, rnd);
  assert.equal(species.length, 6);
  assert.equal(new Set(species.map((s) => s.key)).size, 6);
  for (const { spec } of species) {
    assert.equal(spec.hunger, effectOf(chem, spec.traits).hunger, 'the effect comes from the traits');
  }
  const feeds = species.map(({ spec }) => effectOf(chem, spec.traits).feed);
  assert.ok(feeds.filter((f) => f === 'poison').length >= 2);
  assert.ok(feeds.filter((f) => f === 'nourishing').length >= 2);
});

test('registering species replaces the previous map\'s and leaves the classic fruit alone', () => {
  const rnd = seeded(3);
  const chem = createChemistry(rnd);
  registerSpecies(createSpecies(chem, 5, rnd));
  const first = speciesKeys();
  registerSpecies(createSpecies(chem, 4, seeded(99)));
  assert.equal(speciesKeys().length, 4);
  assert.ok(POINT_TYPES.nectar && POINT_TYPES.toxic);
  for (const k of first) if (!speciesKeys().includes(k)) assert.equal(POINT_TYPES[k], undefined);
  for (const k of speciesKeys()) assert.equal(typeof isHarmful(k), 'boolean');
  registerSpecies([]);
});

test('a trait rule needs more than one experience, then blocks untasted fruit that share it', async () => {
  const { createFagi } = await import('../src/fagi.js');
  const { eat } = await import('../src/feeding.js');
  const { verdict } = await import('../src/learned/rules.js');
  const rnd = seeded(11);
  const chem = createChemistry(rnd);
  registerSpecies(createSpecies(chem, 6, rnd));
  const poisonSmell = Object.keys(chem.smell).find((s) => chem.smell[s] === 'poison');
  const poisonous = speciesKeys().filter((k) => POINT_TYPES[k].traits.smell === poisonSmell);
  assert.ok(poisonous.length >= 2);

  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, poisonous[0]);
  assert.equal(fagi.brain.rules.list.some((r) => r.when.cue), false, 'one bite writes no trait rule');
  eat(fagi, poisonous[0]);
  const rule = fagi.brain.rules.list.find((r) => r.when.cue === `smell:${poisonSmell}`);
  assert.ok(rule && !rule.retired, 'two bad bites write "avoid" for the smell');
  assert.equal(verdict(fagi, 'eat', poisonous[1]), 'avoid', 'an untasted fruit with that smell is avoided');
  assert.equal(verdict(fagi, 'eat', poisonous[1], { deliberate: true }), null, 'unless she goes for it on purpose: curiosity');
  registerSpecies([]);
});

test('trait rules and trait weights survive export and import', async () => {
  const { createFagi } = await import('../src/fagi.js');
  const { eat } = await import('../src/feeding.js');
  const store = await import('../src/learned/store.js');
  const fagi = createFagi();
  fagi.hunger = 50;
  eat(fagi, 'toxic');
  eat(fagi, 'toxic');
  const text = store.exportText(fagi);
  assert.match(text, /"cue":"smell:rotten"/);
  const other = createFagi();
  store.importText(other, text);
  assert.deepEqual(Object.keys(other.brain.cues).sort(), Object.keys(fagi.brain.cues).sort());
  assert.ok(other.brain.rules.list.some((r) => r.when.cue === 'smell:rotten'));
});
