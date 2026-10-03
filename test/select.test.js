import test from 'node:test';
import assert from 'node:assert/strict';

import { SELECT } from '../src/config.js';
import { args } from '../scripts/batch/args.js';
import { runOnce } from '../scripts/batch/run.js';
import { selectOn } from '../src/decision/select.js';

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
