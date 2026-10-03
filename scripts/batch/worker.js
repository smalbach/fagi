// One core of `--jobs`: sets the world up as batch.js does (same arguments,
// organism, --set) and runs the seeds it is handed, one at a time. Every run
// is built from its seeds alone, so where it runs changes nothing.

import { parentPort, workerData } from 'node:worker_threads';
import { args, applySets } from './args.js';
import { runOnce, runColony } from './run.js';
import { runLineage } from './generations.js';
import { enableOrganism } from '../../src/organism.js';

const opts = args(workerData.argv);
if (opts.organism) enableOrganism();
applySets(opts.sets);

parentPort.on('message', ({ i, seed }) => {
  const r = opts.generations > 0 ? runLineage(opts, seed)
    : opts.colony > 1 ? runColony(opts, seed)
    : runOnce(opts, seed, null);
  parentPort.postMessage({ i, r });
});
