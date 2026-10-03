import test from 'node:test';
import assert from 'node:assert/strict';

import { DRIVE, BRAIN } from '../src/config.js';
import { kappaAt, learnKappa, needOfKind } from '../src/drive.js';

const learned = (fn) => { DRIVE.mode = 'learned'; try { return fn(); } finally { DRIVE.mode = 'innate'; } };

test('innate: κ is the curve she was born with, and nothing is learned', () => {
  const brain = {};
  assert.equal(kappaAt(brain, 'hunger', 0), BRAIN.baseInterest);
  assert.equal(kappaAt(brain, 'hunger', 1), 1);
  learnKappa(brain, 'hunger', 0.5, 1);
  assert.equal(brain.kappa, undefined);
});

test('learned: flat at first; relief felt at a level of need raises κ there', () => {
  learned(() => {
    const brain = {};
    assert.equal(kappaAt(brain, 'thirst', 0.2), DRIVE.prior);
    for (let i = 0; i < 40; i++) { learnKappa(brain, 'thirst', 0.75, 0.9); learnKappa(brain, 'thirst', 0, 0.05); }
    assert.ok(kappaAt(brain, 'thirst', 0.75) > 0.8);
    assert.ok(kappaAt(brain, 'thirst', 0) < 0.1);
    // A poison relieves nothing: it does not teach the drive.
    const before = kappaAt(brain, 'thirst', 0.75);
    learnKappa(brain, 'thirst', 0.75, -1);
    assert.equal(kappaAt(brain, 'thirst', 0.75), before);
  });
});

test('food and trails answer hunger, water thirst', () => {
  assert.equal(needOfKind('food'), 'hunger');
  assert.equal(needOfKind('trail'), 'hunger');
  assert.equal(needOfKind('water'), 'thirst');
  assert.equal(needOfKind('nest'), null);
});
