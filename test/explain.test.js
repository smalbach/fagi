import test from 'node:test';
import assert from 'node:assert/strict';

import { registerSpecies } from '../src/chemistry.js';
import { createFagi } from '../src/fagi.js';
import { eat } from '../src/feeding.js';
import { activeRule } from '../src/learned/rules.js';
import { explain, lines, stance, logBite } from '../src/learned/explain.js';
import { EXPLAIN } from '../src/config.js';
import { t, setLang, getLang } from '../src/i18n.js';

// Hand-made species: `name` is color-shape-smell; `feed` is what it does to hunger.
function species(list) {
  registerSpecies(list.map(([name, feed]) => {
    const [color, shape, smell] = name.split('-');
    return {
      key: name,
      spec: { color: '#fff', radius: 6, aroma: 130, life: 200, hunger: feed, effects: [], traits: { color, shape, smell }, painter: 'berry', species: true },
    };
  }));
}

function taste(fagi, key) {
  for (let i = 0; i < 12; i++) {
    fagi.hunger = 50;
    eat(fagi, key);
    fagi.episode = null;
    if (activeRule(fagi.brain.rules, key, 'avoid') || activeRule(fagi.brain.rules, key, 'prefer')) return;
  }
  throw new Error(`no rule about ${key}`);
}

// Three sour kinds that share nothing else made her sick; a sweet one did her good.
function sourWorld() {
  species([
    ['red-drop-sour', 25], ['blue-round-sour', 25], ['yellow-crystal-sour', 25],
    ['green-drop-sweet', -35], ['purple-orb-sour', 25], ['orange-orb-musky', -12],
  ]);
  const fagi = createFagi();
  for (const k of ['red-drop-sour', 'blue-round-sour', 'yellow-crystal-sour', 'green-drop-sweet']) taste(fagi, k);
  return fagi;
}

test('an untasted fruit is explained by the rule and the bites behind it', () => {
  const fagi = sourWorld();
  const ex = explain(fagi, 'purple-orb-sour');
  assert.equal(ex.tasted, false);
  assert.equal(ex.stance, 'avoid');
  assert.equal(ex.rule.id, 'avoid-smell-sour');
  assert.equal(ex.rule.pro, 3, 'the induced rule, backed by three kinds');
  assert.deepEqual({ kinds: ex.trait.kinds, bad: ex.trait.bad }, { kinds: 3, bad: 3 }, 'three sour kinds, all bad');
  assert.ok(ex.bites.length > 0);
  assert.ok(ex.bites.every((b) => b.key.endsWith('-sour')), 'the bites quoted are of sour kinds');
  registerSpecies([]);
});

test('the counterfactual names the trait her caution hangs on', () => {
  const fagi = sourWorld();
  const ex = explain(fagi, 'purple-orb-sour');
  assert.equal(ex.counterfactual.without, 'smell:sour');
  assert.ok(['curious', 'tempted'].includes(ex.counterfactual.stance));
  registerSpecies([]);
});

test('something like nothing she has tasted: curious, with nothing to point at', () => {
  species([['red-drop-sour', 25], ['purple-orb-musky', 25]]);
  const fagi = createFagi();
  taste(fagi, 'red-drop-sour');
  const ex = explain(fagi, 'purple-orb-musky');
  assert.equal(ex.stance, 'curious');
  assert.equal(ex.rule, null);
  assert.equal(ex.trait, null);
  assert.deepEqual(ex.bites, []);
  assert.equal(ex.counterfactual, null, 'nothing to change her mind about');
  assert.ok(lines(ex).some((l) => l.key === 'why.nothingLikeIt'));
  registerSpecies([]);
});

test('a fruit she has tasted is explained by her own bites of it', () => {
  const fagi = sourWorld();
  const bad = explain(fagi, 'red-drop-sour');
  assert.equal(bad.tasted, true);
  assert.equal(bad.stance, 'avoid');
  assert.equal(bad.rule.id, 'avoid-red-drop-sour', 'its own rule, not a trait rule');
  assert.ok(bad.bites.every((b) => b.key === 'red-drop-sour'));
  assert.equal(bad.counterfactual, null);
  assert.equal(explain(fagi, 'green-drop-sweet').stance, 'likes');
  registerSpecies([]);
});

test('a trait that did her good makes an untasted fruit look good', () => {
  species([['green-drop-sweet', -35], ['red-round-sweet', -35], ['blue-orb-sweet', -35]]);
  const fagi = createFagi();
  taste(fagi, 'green-drop-sweet');
  taste(fagi, 'red-round-sweet');
  assert.ok(['tempted', 'curious'].includes(stance(fagi, 'blue-orb-sweet')));
  const ex = explain(fagi, 'blue-orb-sweet');
  assert.ok(lines(ex).some((l) => l.key === 'why.traitGood'), 'it says the sweet ones did her good');
  registerSpecies([]);
});

test('the bite log is bounded and marks later reckonings', () => {
  const brain = createFagi().brain;
  for (let i = 0; i < EXPLAIN.log + 10; i++) logBite(brain, 'nectar', 0.5, i, false);
  logBite(brain, 'toxic', -0.8, 999, true);
  logBite(brain, 'water', 0.5, 1000, false);
  assert.equal(brain.bites.length, EXPLAIN.log);
  assert.deepEqual(brain.bites.at(-1), { key: 'toxic', at: 999, reward: -0.8, late: true });
  assert.ok(!brain.bites.some((b) => b.key === 'water'), 'only fruit is logged');
});

test('bites survive export and import', async () => {
  const store = await import('../src/learned/store.js');
  const fagi = sourWorld();
  const other = createFagi();
  store.importText(other, store.exportText(fagi));
  assert.deepEqual(other.brain.bites, fagi.brain.bites);
  assert.equal(explain(other, 'purple-orb-sour').stance, 'avoid');
  registerSpecies([]);
});

test('every line of an explanation reads in both languages', () => {
  const fagi = sourWorld();
  const was = getLang();
  const keys = ['purple-orb-sour', 'orange-orb-musky', 'red-drop-sour', 'green-drop-sweet']
    .flatMap((k) => lines(explain(fagi, k)).map((l) => l.key));
  for (const lang of ['en', 'es']) {
    setLang(lang);
    for (const k of new Set(keys)) assert.notEqual(t(k), k, `${lang} has ${k}`);
  }
  setLang(was);
  registerSpecies([]);
});
