import test from 'node:test';
import assert from 'node:assert/strict';

import { VARY } from '../src/config.js';
import { createFagi } from '../src/fagi.js';
import { recombine, createGenome, applyGenome } from '../src/generations.js';
import { founderVary, childVary, VARY_TRAITS } from '../src/variation.js';
import { energyMax, bodyMult } from '../src/biology.js';
import { viewRangeOf } from '../src/vision.js';
import { rng } from '../scripts/batch/random.js';

function withVary(fn, sets = {}) {
  const before = { ...VARY, weight: { ...VARY.weight } };
  Object.assign(VARY, { founders: 1, births: 1 }, sets);
  try { fn(); } finally { Object.assign(VARY, before); }
}

test('off, every founder is the standard and no random number is drawn', () => {
  let draws = 0;
  assert.equal(founderVary(() => { draws++; return 0.5; }), null);
  assert.equal(childVary({ speed: 1.2 }, null, () => { draws++; return 0.5; }), null);
  assert.equal(draws, 0);
  const a = createFagi();
  assert.equal(a.genome, null);
  assert.equal(a.body.speed, 1);
  assert.equal(energyMax(a), energyMax(createFagi()));
});

test('on, founders differ, within the limit, centred on the standard', () => withVary(() => {
  const r = rng(7);
  const all = Array.from({ length: 400 }, () => founderVary(r));
  for (const k of VARY_TRAITS) {
    const vs = all.map((v) => v[k]);
    assert.ok(Math.min(...vs) >= 1 - VARY.limit && Math.max(...vs) <= 1 + VARY.limit, k);
    assert.ok(new Set(vs).size > 100, `${k} varies`);
    const meanLog = vs.reduce((a, v) => a + Math.log(v), 0) / vs.length;
    assert.ok(Math.abs(meanLog) < 0.03, `${k} centred (${meanLog})`);
  }
}));

test('her draw reaches her body: speed, reserves, thirst, sight', () => withVary(() => {
  const f = createFagi();
  f.genome.vary = { ...f.genome.vary, speed: 1.2, energyMax: 0.8, thirst: 1.3, view: 1.1 };
  applyGenome(f, f.genome);
  assert.ok(Math.abs(f.body.speed - 1.2) < 1e-9);
  assert.ok(Math.abs(energyMax(f) / energyMax({ body: { energyMax: 1 } }) - 0.8) < 1e-9);
  assert.ok(Math.abs(bodyMult(f, 'thirst') - 1.3) < 1e-9);
  const plain = createFagi();
  plain.genome = null;
  plain.body = { speed: 1, energyMax: 1, metabolism: 1, insulation: 1 };
  assert.ok(Math.abs(viewRangeOf(f) / viewRangeOf(plain) - 1.1) < 1e-9);
}));

test('a trait weighted 0 never varies', () => withVary(() => {
  const r = rng(3);
  for (let i = 0; i < 50; i++) assert.equal(founderVary(r).speed, 1);
}, { weight: { ...VARY.weight, speed: 0 } }));

test('newborns: births off are standard; with heritability they lean to their parents', () => {
  withVary(() => {
    const g = recombine({ ...createGenome(), vary: { speed: 1.3 } }, { ...createGenome(), vary: { speed: 1.3 } }, rng(1));
    assert.equal(g.vary, undefined);
  }, { births: 0 });
  const meanSpeed = (h) => {
    let sum = 0;
    withVary(() => {
      const r = rng(11);
      const fast = { speed: 1.3 };
      for (let i = 0; i < 400; i++) sum += Math.log(childVary(fast, fast, r).speed);
    }, { heritability: h });
    return Math.exp(sum / 400);
  };
  assert.ok(Math.abs(meanSpeed(0) - 1) < 0.03, 'no heritability: a new lottery around 1');
  assert.ok(Math.abs(meanSpeed(1) - 1.3) < 0.03, 'full heritability: around the parents');
  assert.ok(meanSpeed(0.5) > 1.08 && meanSpeed(0.5) < 1.22, 'half way');
});
