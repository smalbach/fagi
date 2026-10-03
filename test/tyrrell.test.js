import test from 'node:test';
import assert from 'node:assert/strict';

import { args } from '../scripts/batch/args.js';
import { runOnce } from '../scripts/batch/run.js';
import { reportTyrrell } from '../scripts/batch/tyrrell.js';

test('without --tyrrell a run carries no Tyrrell measures', () => {
  const r = runOnce({ ...args([]), duration: 30, dt: 0.1 }, 1);
  assert.equal(r.tyrrell, undefined);
  assert.deepEqual(reportTyrrell([r]), []);
});

test('with --tyrrell every requirement that is measured comes out in range', () => {
  const r = runOnce({ ...args(['--tyrrell']), duration: 600, dt: 0.1 }, 1);
  const t = r.tyrrell;
  for (const k of ['r1Untended', 'r1Critical', 'r7Dither', 'r1112Compromise']) assert.ok(t[k] >= 0 && t[k] <= 1, `${k} ${t[k]}`);
  assert.ok(t.r7Switches > 0);
  for (const v of Object.values(t.r3)) if (v != null) assert.ok(v >= -1 && v <= 1);
  assert.ok(reportTyrrell([r]).some((l) => l.includes('switches a minute')));
});
