import test from 'node:test';
import assert from 'node:assert/strict';

import { params, epochOf } from '../research/lab/params.js';
import { runLineage, withConfig } from '../research/lab/lineage.js';
import { theoryOf, seed } from '../research/lab/theory.js';
import { accuracy } from '../research/lab/truth.js';
import { createChemistry, createSpecies, registerSpecies, speciesUnder } from '../src/chemistry.js';
import { createFagi } from '../src/fagi.js';
import { SOCIAL } from '../src/config.js';

function seeded(s) {
  let x = s >>> 0;
  return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
}

const small = (over = {}) => params({ generations: 3, switchAt: 2, colony: 3, life: 900, ...over });

test('a lineage is a function of its parameters and its seed', () => {
  const a = runLineage(small(), 7);
  const b = runLineage(small(), 7);
  assert.deepEqual(a, b);
  assert.notDeepEqual(runLineage(small(), 8).rows, a.rows);
  assert.equal(a.rows.length, 3);
  assert.deepEqual(a.rows.map((r) => r.epoch), [0, 0, 1]);
});

test('a lineage leaves the configuration as it found it', () => {
  const was = { ...SOCIAL };
  runLineage(small({ format: 'verdict', budget: 2, sets: { 'SOCIAL.trust': 0.9 } }), 1);
  assert.deepEqual(SOCIAL, was);
  assert.throws(() => withConfig({ 'SOCIAL.nope': 1 }, () => {}), /unknown setting/);
});

test('parameters are checked', () => {
  assert.throws(() => params({ format: 'gossip' }), /format must be/);
  assert.throws(() => params({ colonies: 3 }), /unknown lab parameter/);
});

test('epochs: one change, or one every period', () => {
  const once = params({ switchAt: 4 });
  assert.deepEqual([0, 3, 4, 11].map((g) => epochOf(once, g)), [0, 0, 1, 1]);
  const periodic = params({ switchAt: 4, period: 2 });
  assert.deepEqual([3, 4, 5, 6, 8].map((g) => epochOf(periodic, g)), [0, 1, 1, 2, 3]);
  assert.equal(epochOf(params({ change: 'none' }), 11), 0);
});

test('a correct theory avoids exactly the poison; a false one gets it backwards', () => {
  const chem = createChemistry(seeded(3), { family: 'one' });
  const catalogue = createSpecies(chem, 10, seeded(4)).map((s) => s.spec.traits);
  registerSpecies(catalogue.map((t) => speciesUnder(chem, t)));
  const taught = (kind) => { const f = createFagi(); seed(f, theoryOf(chem, kind)); return accuracy(f, chem, catalogue); };
  assert.equal(taught('correct').balanced, 1);
  assert.ok(taught('false').balanced < 0.5);
  assert.equal(taught('none').balanced, 0.5);
  registerSpecies([]);
});

test('a partial theory is broader than a conjunctive truth', () => {
  const chem = createChemistry(seeded(5), { family: 'conj' });
  const [avoid] = theoryOf(chem, 'partial');
  assert.equal(avoid.all.length, 1);
  assert.match(avoid.all[0], /^smell:/);
  assert.equal(theoryOf(chem, 'correct')[0].all.length, 2);
});

test('the baselines run, and the oracle never eats poison', () => {
  for (const agent of ['ideal', 'random', 'oracle']) {
    const { rows } = runLineage(small({ agent, culture: 0 }), 2);
    assert.equal(rows.length, 3, agent);
    if (agent === 'oracle') assert.equal(rows.reduce((a, r) => a + r.harmful, 0), 0);
  }
});

test('beliefs passed on are followed back to where they started', () => {
  const { genealogy } = runLineage(small({ theory: 'correct' }), 3);
  assert.ok(genealogy.some((e) => e.seeded), 'the founders\' theory is followed');
  for (const e of genealogy) assert.ok(e.lastG >= e.bornG);
});

test('offered several fruit at once, an ant eats at most one, the one she wants most', () => {
  const one = runLineage(small({ agent: 'oracle', culture: 0 }), 4).rows;
  const three = runLineage(small({ agent: 'oracle', culture: 0, choices: 3 }), 4).rows;
  assert.equal(three.reduce((a, r) => a + r.harmful, 0), 0);
  assert.ok(three.reduce((a, r) => a + r.foodSkipped, 0) <= one.reduce((a, r) => a + r.foodSkipped, 0));
});
