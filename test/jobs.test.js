import test from 'node:test';
import assert from 'node:assert/strict';

import { args } from '../scripts/batch/args.js';
import { runOnce } from '../scripts/batch/run.js';
import { runInParallel } from '../scripts/batch/jobs.js';

test('--jobs: runs spread over cores come out as they do one after another', async () => {
  const argv = ['--map-seed', '7', '--duration', '120', '--dt', '0.1', '--seed', '300', '--jobs', '2'];
  const opts = args(argv);
  const parallel = await runInParallel(argv, opts, 3);
  for (let i = 0; i < 3; i++) {
    assert.equal(JSON.stringify(parallel[i]), JSON.stringify(runOnce(opts, opts.seed0 + i, null)));
  }
});
