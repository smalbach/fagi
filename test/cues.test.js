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

// Hand-made species, so each test knows exactly what shares what.
// `name` is color-shape-smell; `feed` is what it does to hunger.
function species(list) {
  registerSpecies(list.map(([name, feed]) => {
    const [color, shape, smell] = name.split('-');
    return {
      key: name,
      spec: { color: '#fff', radius: 6, aroma: 130, life: 200, hunger: feed, effects: [], traits: { color, shape, smell }, painter: 'berry', species: true },
    };
  }));
}

// Eats until her own rule about it is written ('avoid' or 'prefer').
async function taste(fagi, key) {
  const { eat } = await import('../src/feeding.js');
  const { activeRule } = await import('../src/learned/rules.js');
  for (let i = 0; i < 12; i++) {
    fagi.hunger = 50;
    eat(fagi, key);
    fagi.episode = null;
    if (activeRule(fagi.brain.rules, key, 'avoid') || activeRule(fagi.brain.rules, key, 'prefer')) return;
  }
  throw new Error(`no rule about ${key}`);
}

const traitRules = (fagi) => fagi.brain.rules.list.filter((r) => !r.retired && r.when.all);
// Only the induced ones: one-trait rules from a trait's weight live next to them.
const inducedRules = (fagi) => traitRules(fagi).filter((r) => r.cases);

test('one species is never generalized; two that agree give a rule with only what they share', async () => {
  const { createFagi } = await import('../src/fagi.js');
  const { verdict } = await import('../src/learned/rules.js');
  species([['red-drop-sour', 25], ['blue-drop-sour', 25], ['green-drop-sour', 25], ['yellow-crystal-sour', 25]]);
  const fagi = createFagi();

  await taste(fagi, 'red-drop-sour');
  assert.deepEqual(inducedRules(fagi), [], 'one bad species says nothing about its traits yet');

  await taste(fagi, 'blue-drop-sour');
  const [rule] = inducedRules(fagi);
  assert.equal(rule.id, 'avoid-shape-drop-smell-sour', 'color differs, so it is dropped');
  assert.deepEqual(rule.cases, ['blue-drop-sour', 'red-drop-sour']);
  assert.equal(rule.pro, 2);
  assert.equal(rule.con, 0);
  assert.equal(verdict(fagi, 'eat', 'green-drop-sour'), 'avoid', 'an untasted sour drop is avoided');
  assert.equal(verdict(fagi, 'eat', 'green-drop-sour', { deliberate: true }), null, 'unless she goes for it on purpose: curiosity');
  // With induced rules alone (no one-trait rule about sour), a sour crystal is not a drop.
  const { CUES } = await import('../src/config.js');
  const was = CUES.induce;
  CUES.induce = 1;
  try {
    const other = createFagi();
    await taste(other, 'red-drop-sour');
    await taste(other, 'blue-drop-sour');
    assert.equal(verdict(other, 'eat', 'green-drop-sour'), 'avoid');
    assert.equal(verdict(other, 'eat', 'yellow-crystal-sour'), null, 'a sour crystal is not a drop');
  } finally {
    CUES.induce = was;
  }
  registerSpecies([]);
});

test('a third case generalizes the rule, and the new rule says where it came from', async () => {
  const { createFagi } = await import('../src/fagi.js');
  species([['red-drop-sour', 25], ['blue-drop-sour', 25], ['yellow-crystal-sour', 25]]);
  const fagi = createFagi();
  await taste(fagi, 'red-drop-sour');
  await taste(fagi, 'blue-drop-sour');
  await taste(fagi, 'yellow-crystal-sour');

  const [rule] = inducedRules(fagi);
  assert.equal(rule.id, 'avoid-smell-sour');
  assert.equal(rule.from, 'avoid-shape-drop-smell-sour');
  assert.equal(rule.pro, 3);
  const old = fagi.brain.rules.list.find((r) => r.id === 'avoid-shape-drop-smell-sour');
  assert.ok(old.retired, 'the narrower rule is retired, kept as history');
  assert.equal(fagi.brain.lastRule.kind, 'refined');
  registerSpecies([]);
});

test('a counterexample becomes an exception, not the end of the rule', async () => {
  const { createFagi } = await import('../src/fagi.js');
  const { verdict } = await import('../src/learned/rules.js');
  species([
    ['red-drop-sour', 25], ['blue-round-sour', 25], ['yellow-crystal-sour', 25],
    ['purple-orb-sour', -35], ['purple-drop-sour', 25], ['green-drop-sour', 25],
  ]);
  const fagi = createFagi();
  for (const k of ['red-drop-sour', 'blue-round-sour', 'yellow-crystal-sour']) await taste(fagi, k);
  await taste(fagi, 'purple-orb-sour');

  const [rule] = inducedRules(fagi).filter((r) => r.verdict === 'avoid');
  assert.equal(rule.id, 'avoid-smell-sour', 'still about sour things');
  assert.equal(rule.con, 1);
  assert.deepEqual(rule.except, ['color:purple'], 'what sets the good one apart');
  assert.equal(verdict(fagi, 'eat', 'green-drop-sour'), 'avoid');
  assert.equal(verdict(fagi, 'eat', 'purple-drop-sour'), null, 'a purple sour fruit is the exception');
  registerSpecies([]);
});

test('a description contradicted as often as it holds is not a rule', async () => {
  const { induce } = await import('../src/learned/induce.js');
  const { createFagi } = await import('../src/fagi.js');
  species([['red-drop-sour', 25], ['red-round-sweet', 25], ['red-orb-musky', -35], ['red-crystal-sharp', -35]]);
  const fagi = createFagi();
  for (const k of ['red-drop-sour', 'red-round-sweet', 'red-orb-musky', 'red-crystal-sharp']) await taste(fagi, k);
  assert.deepEqual(induce(fagi.brain), [], 'red is as often good as bad: nothing to say about red');
  registerSpecies([]);
});

test('with induction off, a trait rule comes from the trait\'s own weight', async () => {
  const { createFagi } = await import('../src/fagi.js');
  const { eat } = await import('../src/feeding.js');
  const { CUES } = await import('../src/config.js');
  const was = CUES.induce;
  CUES.induce = 0;
  try {
    const fagi = createFagi();
    fagi.hunger = 50;
    eat(fagi, 'toxic');
    assert.deepEqual(traitRules(fagi), [], 'one bite writes no trait rule');
    eat(fagi, 'toxic');
    assert.ok(traitRules(fagi).some((r) => r.id === 'avoid-smell-rotten'), 'two bad bites write "avoid" for its smell');
  } finally {
    CUES.induce = was;
  }
});

test('induced rules survive export and import, and old one-trait rules still load', async () => {
  const { createFagi } = await import('../src/fagi.js');
  const store = await import('../src/learned/store.js');
  species([['red-drop-sour', 25], ['blue-drop-sour', 25]]);
  const fagi = createFagi();
  await taste(fagi, 'red-drop-sour');
  await taste(fagi, 'blue-drop-sour');
  const text = store.exportText(fagi);
  assert.match(text, /"all":\["shape:drop","smell:sour"\]/);
  const other = createFagi();
  store.importText(other, text);
  assert.deepEqual(Object.keys(other.brain.cues).sort(), Object.keys(fagi.brain.cues).sort());
  assert.deepEqual(inducedRules(other), inducedRules(fagi));

  const old = `rule('avoid-smell-rotten', {"on":["eat"],"when":{"cue":"smell:rotten"},"verdict":"avoid","weight":-0.3,"because":[],"learnedAt":1,"tries":2,"stage":"short"})`;
  store.importText(other, old);
  assert.deepEqual(other.brain.rules.list[0].when, { all: ['smell:rotten'] });
  registerSpecies([]);
});
