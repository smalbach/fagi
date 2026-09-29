// One population that breeds in its world, measured (F5,
// docs/research/forage-protocol.md). Nothing here decides anything: it runs
// the game's own code and watches which foraging genes go on.
//
// LIFE.founders adults, founders with every foraging gene at 0 (the choice of
// way 1), nothing created by the runner after them. Whatever values the
// genes reach come from mutation, and from who lives long enough and is in
// good enough shape to breed.
//
//   extinct       1 if none is left, or none that could breed
//   alive         how many are alive at the end
//   generations   the deepest generation born
//   hatched       young born
//   explore, site, memory, patience
//                 the mean of each foraging gene over the living at the end
//                 (null if none is alive)
//   exploreShare  over everyone who chose at least 5 times: the share of
//                 "explore" in her choices

import { createWorld, nestOf } from '../../src/world.js';
import { generateMap } from '../../src/mapgen.js';
import { stepWorld } from '../../src/simulation.js';
import { createColony, updateColony } from '../../src/colony.js';
import { census } from '../../src/reproduction.js';
import { LIFE } from '../../src/config.js';
import { FORAGE_GENES } from '../../src/generations.js';
import { registerSpecies } from '../../src/chemistry.js';
import { rng, withRng } from '../../scripts/batch/random.js';

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const r3 = (v) => (v == null ? null : Math.round(v * 1000) / 1000);

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
  const alive = colony.ants.filter((f) => f.alive);
  const breeders = (sex) => alive.some((f) => f.sex === sex && f.lifeStage !== 'senescent');
  const genes = Object.fromEntries(FORAGE_GENES.map((k) => [k, r3(mean(alive.map((f) => f.genome?.forage?.[k] ?? 0)))]));
  const choosers = colony.ants.map((f) => f.brain.choice?.counts).filter((k) => k && k.site + k.explore >= 5);
  const out = {
    extinct: c.alive === 0 || !breeders('female') || !breeders('male') ? 1 : 0,
    alive: c.alive,
    generations: c.generations,
    hatched: colony.life?.hatched ?? 0,
    ...(alive.length ? genes : Object.fromEntries(FORAGE_GENES.map((k) => [k, null]))),
    exploreShare: r3(mean(choosers.map((k) => k.explore / (k.site + k.explore)))),
  };
  registerSpecies([]);
  return out;
}
