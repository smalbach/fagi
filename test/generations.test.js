import test from 'node:test';
import assert from 'node:assert/strict';

import { createFagi } from '../src/fagi.js';
import { eat } from '../src/feeding.js';
import { activeRule } from '../src/learned/rules.js';
import { createGenome, mutate, applyGenome, teach, pick, ALL_CUES } from '../src/generations.js';
import { createChemistry, invertChemistry, registerSpecies } from '../src/chemistry.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { explain, lines } from '../src/learned/explain.js';
import { habit, move } from '../src/habits.js';
import { GEN, SOCIAL, MAPGEN } from '../src/config.js';

function seeded(s) {
  let x = s >>> 0;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
}

function live(fagi, key) {
  for (let i = 0; i < 12; i++) {
    fagi.hunger = 50;
    eat(fagi, key);
    fagi.episode = null;
    if (activeRule(fagi.brain.rules, key, 'avoid') || activeRule(fagi.brain.rules, key, 'prefer')) return;
  }
  throw new Error(`no rule about ${key}`);
}

test('a child genome is the parent\'s, nudged a little on every trait', () => {
  const parent = { cues: { 'smell:sour': -0.5 } };
  const child = mutate(parent, seeded(3));
  assert.ok(Math.abs(child.cues['smell:sour'] + 0.5) < GEN.mutation * 4, 'close to the parent');
  assert.ok(Object.keys(child.cues).every((c) => ALL_CUES.includes(c)));
  assert.ok(Object.values(child.cues).every((w) => w >= -1 && w <= 1));
  assert.deepEqual(mutate(parent, seeded(3)), child, 'the same random source gives the same child');
});

test('an innate bias is a trait weight she is born with, and it shows in her explanations', async () => {
  species();
  const fagi = createFagi();
  applyGenome(fagi, { cues: { 'smell:sour': -0.8 } });
  assert.deepEqual(fagi.brain.cues['smell:sour'], { w: -0.8, n: GEN.innateN, lastAt: 0, innate: true });
  // One trait of three is a nudge, not a verdict: her curiosity drops, her
  // stance may not change.
  const { predict, wariness } = await import('../src/learned/cues.js');
  assert.ok(wariness(predict(fagi.brain.cues, ['color:red', 'shape:drop', 'smell:sour'])) > 0);
  assert.ok(lines(explain(fagi, 'red-drop-sour')).some((l) => l.key === 'why.innateBad'));
  registerSpecies([]);
});

test('without genes, the genome is carried but not expressed', () => {
  const fagi = createFagi();
  GEN.genes = 0;
  try { applyGenome(fagi, { cues: { 'smell:sour': -0.8 } }); } finally { GEN.genes = 1; }
  assert.equal(fagi.brain.cues['smell:sour'], undefined);
  assert.deepEqual(fagi.genome.cues, { 'smell:sour': -0.8 });
});

test('an elder teaches her rules marked "born", trusted less, and her habits', () => {
  const elder = Object.assign(createFagi(), { id: 3 });
  live(elder, 'toxic');
  move(elder, 'tasteAt', 'safer', { key: 'x' });
  const child = createFagi();
  assert.equal(teach(child, elder), 1);
  const r = activeRule(child.brain.rules, 'toxic', 'avoid');
  assert.deepEqual(r.source, { kind: 'born', from: 3, at: 0, trust: GEN.cultureTrust });
  assert.equal(habit(child, 'tasteAt'), habit(elder, 'tasteAt'));
  assert.ok(lines(explain(child, 'toxic')).some((l) => l.key === 'why.born'));
});

test('a tradition nobody lives again fades: taught on, it drops below what is worth passing', () => {
  const [a, b, c, d] = [1, 2, 3, 4].map((id) => Object.assign(createFagi(), { id }));
  live(a, 'toxic');
  teach(b, a);
  teach(c, b);
  const inC = activeRule(c.brain.rules, 'toxic', 'avoid');
  assert.ok(Math.abs(inC.source.trust - GEN.cultureTrust ** 2) < 1e-9);
  assert.equal(teach(d, c), GEN.cultureTrust ** 3 >= SOCIAL.minTrust ? 1 : 0);
  assert.equal(activeRule(d.brain.rules, 'toxic', 'avoid'), null);
});

test('without culture nothing is taught', () => {
  const elder = createFagi();
  live(elder, 'toxic');
  GEN.culture = 0;
  try { assert.equal(teach(createFagi(), elder), 0); } finally { GEN.culture = 1; }
});

test('parents are picked by weight', () => {
  const rnd = seeded(9);
  const counts = { a: 0, b: 0 };
  for (let i = 0; i < 1000; i++) counts[pick(['a', 'b'], [1, 3], rnd)]++;
  assert.ok(counts.b > counts.a * 2, JSON.stringify(counts));
  assert.ok(['a', 'b'].includes(pick(['a', 'b'], [0, 0], rnd)), 'all zero picks any');
});

test('an inverted chemistry swaps the poison and the food smells; a map can be given one', () => {
  const chem = createChemistry(seeded(5));
  const inv = invertChemistry(chem);
  const poison = Object.keys(chem.smell).find((s) => chem.smell[s] === 'poison');
  const food = Object.keys(chem.smell).find((s) => chem.smell[s] === 'nourishing');
  assert.equal(inv.smell[poison], 'nourishing');
  assert.equal(inv.smell[food], 'poison');
  assert.deepEqual(inv.color, chem.color);

  const was = MAPGEN.species;
  MAPGEN.species = 6;
  try {
    const world = createWorld();
    generateMap(world, { chemistry: inv });
    assert.equal(world.chemistry, inv);
  } finally {
    MAPGEN.species = was;
    registerSpecies([]);
  }
});

test('a fresh genome has no biases', () => {
  assert.deepEqual(createGenome(), { cues: {} });
});

function species() {
  registerSpecies([{ key: 'red-drop-sour', spec: { color: '#fff', radius: 6, aroma: 130, life: 200, hunger: 25, effects: [], traits: { color: 'red', shape: 'drop', smell: 'sour' }, painter: 'berry', species: true } }]);
}
