// The lab of the main study, in the reader's browser: the same code as
// research/lab (the game's brain, body and social code, without the map), so
// a seed here gives the same lineage as `node research/run.js` would.
import { runLineage } from '../research/lab/lineage.js';
import { params } from '../research/lab/params.js';

const BASE = { family: 'one', life: 1800, choices: 3, switchAt: 6, generations: 12 };

self.onmessage = ({ data }) => {
  const { seed, change, formats, id } = data;
  for (const format of formats) {
    const t0 = performance.now();
    const { rows, genealogy } = runLineage(params({ ...BASE, change, format }), seed);
    self.postMessage({
      id, format, ms: Math.round(performance.now() - t0),
      rows: rows.map((r) => ({ g: r.g, alive: r.alive / r.ants, harmful: r.harmful / r.ants, myths: r.mythsEnd / r.ants, acc: r.accBirth })),
      genealogy: genealogy.map(({ origin, seeded, bornG, lastG, told, maxCarriers, trail }) => ({ origin, seeded, bornG, lastG, told, maxCarriers, trail })),
    });
  }
  self.postMessage({ id, done: true });
};
