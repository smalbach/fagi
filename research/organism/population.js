// One population left alone, measured (§18.4): LIFE.founders adults on a map,
// the whole organism, nothing created by the runner after them.
//
//   alive       how many are alive at the end
//   extinct     1 if none is left, or none that could ever breed again (no
//               female, or no male, alive and not yet old)
//   generations the deepest generation born
//   hatched     young born
//   inbreeding  mean inbreeding of the eggs
//   diversity   genetic diversity of the living
//   judgment    mean judgment of the living adults (life.js judgment)
//   old         share of deaths that were of old age

import { createWorld, nestOf } from '../../src/world.js';
import { generateMap } from '../../src/mapgen.js';
import { stepWorld } from '../../src/simulation.js';
import { createColony, updateColony } from '../../src/colony.js';
import { LIFE } from '../../src/config.js';
import { census } from '../../src/reproduction.js';
import { diversity } from '../../src/generations.js';
import { registerSpecies } from '../../src/chemistry.js';
import { rng, withRng } from '../../scripts/batch/random.js';
import { judgment } from './life.js';

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function runPopulation({ seed, mapSeed, seconds, dt = 0.05 }) {
  const world = withRng(rng(mapSeed), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(seed * 7919);
  const antRng = rng(seed);
  const colony = withRng(antRng, () => createColony(LIFE.founders));
  const nest = nestOf(world);
  for (const f of colony.ants) { f.x = nest.x; f.y = nest.y; }
  world.colony = colony;
  const steps = Math.ceil(seconds / dt);
  for (let s = 0; s < steps; s++) {
    withRng(worldRng, () => stepWorld(world, dt));
    withRng(antRng, () => updateColony(world, colony, dt));
    if (colony.life?.extinctAt != null) break;
  }
  const c = census(world, colony);
  const living = colony.ants.filter((f) => f.alive);
  const breeders = (sex) => living.some((f) => f.sex === sex && f.lifeStage !== 'senescent');
  const adults = living.filter((f) => f.lifeStage === 'adult');
  const inbred = Object.values(world.lineage ?? {}).filter((l) => l.inbreeding != null).map((l) => l.inbreeding);
  const deaths = Object.values(c.deaths).reduce((a, b) => a + b, 0);
  const out = {
    alive: c.alive,
    extinct: c.alive === 0 || !breeders('female') || !breeders('male') ? 1 : 0,
    generations: c.generations,
    hatched: c.hatched,
    inbreeding: mean(inbred) ?? 0,
    diversity: living.length > 1 ? diversity(living.map((f) => f.genome)) : 0,
    judgment: mean(adults.map((f) => judgment(f, world.chemistry))),
    old: deaths ? (c.deaths.age ?? 0) / deaths : null,
    deaths: c.deaths,
  };
  registerSpecies([]);
  return out;
}
