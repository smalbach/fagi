import test from 'node:test';
import assert from 'node:assert/strict';

import { LIFE, MORPH, HABITATS, COLONIES, MAPGEN } from '../src/config.js';
import { enableOrganism } from '../src/organism.js';
import { createWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { stepWorld } from '../src/simulation.js';
import { createColony, updateColony } from '../src/colony.js';
import { recordEvolution, evolutionOf, EVERY, ORGANS } from '../src/evolution.js';
import { rng, withRng } from '../scripts/batch/random.js';

function colonyWorld(seed) {
  const world = withRng(rng(seed), () => { const w = createWorld(); generateMap(w); return w; });
  const colony = withRng(rng(seed + 1), () => createColony(LIFE.founders));
  world.colony = colony;
  return { world, colony };
}

function run(seconds, record) {
  const { world, colony } = colonyWorld(11);
  const wr = rng(5), ar = rng(6);
  for (let t = 0; t < seconds; t += 0.1) {
    withRng(wr, () => stepWorld(world, 0.1));
    withRng(ar, () => updateColony(world, colony, 0.1));
    if (record) recordEvolution(world);
  }
  return { world, colony };
}

test('recording the colonies\' history changes nothing they do', () => {
  const was = [LIFE.enabled, MORPH.enabled, HABITATS.enabled, COLONIES.count, MAPGEN.inside];
  enableOrganism();
  Object.assign(MORPH, { enabled: 1 }); HABITATS.enabled = 1; COLONIES.count = 3; MAPGEN.inside = 1;
  try {
    const a = run(EVERY * 3 + 1, false);
    const b = run(EVERY * 3 + 1, true);
    const where = (c) => c.colony.ants.map((f) => `${f.id}:${f.x.toFixed(6)},${f.y.toFixed(6)},${f.alive}`).join('|');
    assert.equal(where(b), where(a));
    const log = evolutionOf(b.world);
    assert.equal(log.samples.length, 4);
    const s = log.samples.at(-1);
    assert.equal(s.nests.length, 3);
    assert.deepEqual(new Set(s.nests.map((n) => n.habitat)), new Set(HABITATS.kinds));
    const withAnts = s.nests.find((n) => n.alive > 0);
    assert.ok(withAnts, 'some nest has ants');
    for (const k of ORGANS) assert.ok(Number.isFinite(withAnts.gene[k]), `gene ${k}`);
  } finally {
    enableOrganism(false);
    [LIFE.enabled, MORPH.enabled, HABITATS.enabled, COLONIES.count, MAPGEN.inside] = was;
  }
});
