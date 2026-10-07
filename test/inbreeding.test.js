import test from 'node:test';
import assert from 'node:assert/strict';

import { LIFE } from '../src/config.js';

// The viability formula itself (reproduction.js draws egg.viable from it).
const hatchChance = (F) => Math.exp(-LIFE.inbreeding * F);

test('off by default: inbreeding costs an egg nothing', () => {
  assert.equal(LIFE.inbreeding, 0);
  assert.equal(hatchChance(0.25), 1);
});

test('at the median lethal equivalents a full-sib egg hatches about 2 times in 3', () => {
  const was = LIFE.inbreeding;
  LIFE.inbreeding = 1.57;
  try {
    assert.ok(Math.abs(hatchChance(0.25) - 0.675) < 0.01);
    assert.equal(hatchChance(0), 1);
  } finally {
    LIFE.inbreeding = was;
  }
});
