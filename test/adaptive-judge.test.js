import test from 'node:test';
import assert from 'node:assert/strict';

import { createFagi } from '../src/fagi.js';
import { HUNGER, CARRY, DECIDE } from '../src/config.js';
import { observe, lookOf } from '../src/adaptive-decision/observation.js';
import { createModel, predict, learn } from '../src/adaptive-decision/model.js';
import { adaptiveJudge } from '../src/adaptive-decision/policy.js';
import { enableOrganism } from '../src/organism.js';
import { set, runEpisode } from '../research/adaptive-decision/episode.js';
import { FOOD, DEV_SEED, devMapSeed } from '../research/adaptive-decision/design.js';
import '../src/adaptive-decision/index.js';

// A bite she felt: hunger before and after.
const bite = (fagi, key, before, after) => {
  fagi.eaten = (fagi.eaten ?? 0) + 1;
  fagi.lastMeal = { n: fagi.eaten, type: key, variant: 'twin', hungerBefore: before, hungerAfter: after };
};
const feed = (model, fagi) => learn(model, observe(fagi), () => 1, lookOf);

test('the observation holds only what she can know', () => {
  const fagi = createFagi();
  bite(fagi, 'nectar', 50, 20);
  const obs = observe(fagi);
  assert.deepEqual(Object.keys(obs).sort(), ['age', 'carrying', 'hunger', 'hungerMax', 'meal', 'pantry']);
  assert.deepEqual(Object.keys(obs.meal).sort(), ['after', 'before', 'key', 'n']);
  const text = JSON.stringify(obs);
  for (const hidden of ['variant', 'twin', 'spec', 'facts', 'chemistry']) assert.ok(!text.includes(hidden), hidden);
});

test('a harmful bite raises what she expects of that kind, and of kinds that look like it', () => {
  const fagi = createFagi();
  const model = createModel();
  const before = predict(model, 'toxic', lookOf('toxic')).p;
  bite(fagi, 'toxic', 40, 65);
  const r = feed(model, fagi);
  assert.equal(r.harmed, true);
  assert.ok(predict(model, 'toxic', lookOf('toxic')).p > before);
  // A kind never eaten that shares a trait with it is judged by that trait.
  const shared = lookOf('toxic');
  assert.ok(predict(model, 'unseen', shared).p > predict(createModel(), 'unseen', shared).p);
});

test('surprise makes old evidence fade only when the model adapts', () => {
  const run = (adaptive) => {
    const fagi = createFagi();
    const model = createModel({ adaptive });
    for (let i = 0; i < 6; i++) { bite(fagi, 'nectar', 50, 15); feed(model, fagi); }
    bite(fagi, 'nectar', 50, 75); feed(model, fagi);   // it harmed, against all she knew
    return model.kinds.nectar.good;
  };
  assert.equal(run(false), 6);
  assert.ok(run(true) < 6);
});

test('the judge leaves what harmed, eats what fed and gives a new kind a trial bite', () => {
  const judge = adaptiveJudge();
  const fagi = createFagi();
  fagi.hunger = HUNGER.max * 0.6;
  for (let i = 0; i < 4; i++) { bite(fagi, 'toxic', 50, 75); judge.carried(fagi, 'toxic'); }
  for (let i = 0; i < 4; i++) { bite(fagi, 'nectar', 50, 15); judge.carried(fagi, 'nectar'); }
  fagi.hunger = HUNGER.max * 0.6;
  assert.equal(judge.ground(fagi, { type: 'toxic' }), 'leave');
  assert.equal(judge.ground(fagi, { type: 'nectar' }), 'eat');
  fagi.hunger = CARRY.eatBelow - 20;
  fagi.carrying = { type: 'nectar' };   // nothing to carry with: only the bite is in question
  assert.equal(judge.ground(fagi, { type: 'unseen-kind' }), 'taste');
});

test('a life judged by the model is repeatable (the model draws no randomness)', () => {
  enableOrganism();
  set({ ...FOOD, 'DECIDE.eat': 'model' });
  try {
    const a = runEpisode({ seed: DEV_SEED, mapSeed: devMapSeed(0), horizon: 400 });
    const b = runEpisode({ seed: DEV_SEED, mapSeed: devMapSeed(0), horizon: 400 });
    assert.equal(a.fingerprint, b.fingerprint);
    assert.ok(a.adaptive && a.adaptive.counts);
  } finally { DECIDE.eat = null; DECIDE.enabled = 0; }
});
