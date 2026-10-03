// --jobs: the runs spread over several cores (worker.js), handed out one at a
// time as each core comes free, and given back in seed order.

import { Worker } from 'node:worker_threads';

export function runInParallel(argv, opts, count, onDone) {
  const results = new Array(count);
  let next = 0, done = 0;
  return new Promise((resolve, reject) => {
    const n = Math.min(opts.jobs, count);
    const workers = [];
    const give = (w) => {
      if (next >= count) { w.terminate(); return; }
      const i = next++;
      w.postMessage({ i, seed: opts.seed0 + i });
    };
    for (let k = 0; k < n; k++) {
      const w = new Worker(new URL('./worker.js', import.meta.url), { workerData: { argv }, execArgv: [] });
      w.on('message', ({ i, r }) => {
        results[i] = r;
        done += 1;
        onDone?.(done, count);
        if (done === count) { workers.forEach((x) => x.terminate()); resolve(results); }
        else give(w);
      });
      w.on('error', reject);
      workers.push(w);
      give(w);
    }
  });
}
