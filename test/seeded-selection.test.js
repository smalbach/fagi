import test from 'node:test';
import assert from 'node:assert/strict';

import { mothers, SEEDS } from '../research/code-culture/seeded.js';
import { conduct } from '../src/learned/conduct.js';
import { rng } from '../scripts/batch/random.js';

const life = (survival, eaten = 0) => ({ survival, eaten, born: [] });

test('a tournament of the whole generation always picks the one that lived longest', () => {
  const prev = [life(0.4), life(1), life(0.7)];
  for (const m of mothers(prev, rng(1), 'tournament', 3)) assert.equal(m, prev[1]);
});

test('ties in how long they lived go to the one that ate most', () => {
  const prev = [life(1, 3), life(1, 9), life(1, 5)];
  for (const m of mothers(prev, rng(2), 'tournament', 3)) assert.equal(m, prev[1]);
});

test('a tournament of one is a random mother: it can pick the worst', () => {
  const prev = [life(0), life(1)];
  const picked = mothers(Array(200).fill(null).map((_, i) => prev[i % 2]), rng(3), 'tournament', 1);
  assert.ok(picked.some((m) => m.survival === 0));
});

test('mothers are reproducible from their seed', () => {
  const prev = Array.from({ length: 30 }, (_, i) => life((i * 7) % 11 / 10));
  assert.deepEqual(mothers(prev, rng(4), 'tournament', 3), mothers(prev, rng(4), 'tournament', 3));
  assert.deepEqual(mothers(prev, rng(5), 'random'), mothers(prev, rng(5), 'random'));
});

test('the seeded lines are valid lines of conduct', () => {
  for (const lines of Object.values(SEEDS)) {
    for (const { id, ...spec } of lines) conduct(id, { weight: 1, tries: 0, stage: 'long', learnedAt: 0, source: 'born', ...spec });
  }
});
