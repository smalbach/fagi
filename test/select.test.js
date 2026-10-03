import test from 'node:test';
import assert from 'node:assert/strict';

import { SELECT, HUNGER, THIRST, ENERGY } from '../src/config.js';
import { args } from '../scripts/batch/args.js';
import { runOnce } from '../scripts/batch/run.js';
import { selectOn, criticalNeeds } from '../src/decision/select.js';

test('by default her program decides as always: the first line that answers', () => {
  assert.equal(SELECT.mode, 'program');
  assert.equal(selectOn(), false);
});

for (const mode of ['freeflow', 'freeflow+central']) {
  test(`${mode}: a life runs, the survival reflexes still act and the lines vote for the rest`, () => {
    SELECT.mode = mode;
    try {
      const r = runOnce({ ...args(['--organism']), duration: 900, dt: 0.1 }, 3);
      assert.ok(r.lived > 0);
      assert.ok(Object.keys(r.actions).length > 2, Object.keys(r.actions).join(','));
    } finally { SELECT.mode = 'program'; }
  });
}

test('critical needs: only those past their threshold, the furthest past it first', () => {
  const fagi = { hunger: 0, thirst: 0, energy: ENERGY.max, thermalStress: 0 };
  assert.deepEqual(criticalNeeds(fagi), []);
  fagi.energy = 0;
  fagi.hunger = HUNGER.max * 0.99;
  assert.deepEqual(criticalNeeds(fagi).slice(0, 2).sort(), ['energy', 'hunger']);
  fagi.hunger = 0;
  fagi.thirst = THIRST.max * 0.99;
  assert.ok(criticalNeeds(fagi).includes('thirst'));
});

test('veto: with a critical need, a life runs and the selector still decides', () => {
  SELECT.mode = 'freeflow+central';
  SELECT.veto = 1;
  SELECT.consume = 4;
  try {
    const r = runOnce({ ...args(['--organism']), duration: 900, dt: 0.1 }, 3);
    assert.ok(r.lived > 0);
    assert.ok(Object.keys(r.actions).length > 2, Object.keys(r.actions).join(','));
  } finally { SELECT.mode = 'program'; SELECT.veto = 0; SELECT.consume = 0; }
});

test('sequence: a won act keeps the floor until it is done, and a life runs', () => {
  SELECT.mode = 'freeflow+central';
  SELECT.veto = 1;
  SELECT.consume = 4;
  SELECT.sequence = 3;
  try {
    const r = runOnce({ ...args(['--organism']), duration: 900, dt: 0.1 }, 3);
    assert.ok(r.lived > 0);
    assert.ok(Object.keys(r.actions).length > 2, Object.keys(r.actions).join(','));
  } finally { SELECT.mode = 'program'; SELECT.veto = 0; SELECT.consume = 0; SELECT.sequence = 0; }
});
