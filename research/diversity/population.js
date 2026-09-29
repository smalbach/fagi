// One population whose world turns over between generations, measured
// (docs/research/diversity-protocol.md). Nothing here decides anything: it runs
// the game's own code and watches.
//
// LIFE.founders adults on a map, the whole organism, nothing created by the
// runner after them (research/organism/population.js). At `shiftAt` the
// chemistry turns upside down: what fed now poisons, and the other way round.
// By then the founders are old or gone; the living were born, taught and
// selected in the old world.
//
//   extinct         1 if none is left, or none that could breed (no female or no
//                   male alive and not yet old)
//   alive           how many are alive at the end
//   judgmentBefore  mean judgment (life.js) of the living adults just before the
//                   shift, against the old chemistry
//   judgmentHit     the same adults, same beliefs, against the new chemistry: how
//                   wrong the change made them
//   judgmentEnd     living adults at the end, against the chemistry of the end
//   judgmentNew     of those, the ones born after the shift (null if none)
//   diversityBefore genetic diversity of the living just before the shift
//   diversityEnd    and at the end
//   hatchedAfter    young born after the shift
//   poisonAfter     deaths by poison after the shift, per individual that lived
//                   some of it
//   deathsAfter     deaths after the shift, by cause
//   generations     the deepest generation born

import { createWorld, nestOf } from '../../src/world.js';
import { generateMap } from '../../src/mapgen.js';
import { stepWorld } from '../../src/simulation.js';
import { createColony, updateColony } from '../../src/colony.js';
import { census } from '../../src/reproduction.js';
import { LIFE } from '../../src/config.js';
import { diversity } from '../../src/generations.js';
import { invertChemistry, speciesUnder, registerSpecies } from '../../src/chemistry.js';
import { rng, withRng } from '../../scripts/batch/random.js';
import { judgment } from '../organism/life.js';

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function shift(world) {
  world.chemistry = invertChemistry(world.chemistry);
  world.species = world.species.map((sp) => speciesUnder(world.chemistry, sp.spec.traits));
  registerSpecies(world.species);
}

export function runShiftPopulation({ seed, mapSeed, seconds, shiftAt, invert, dt = 0.05 }) {
  const world = withRng(rng(mapSeed), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(seed * 7919);
  const antRng = rng(seed);
  const colony = withRng(antRng, () => createColony(LIFE.founders));
  const nest = nestOf(world);
  for (const f of colony.ants) { f.x = nest.x; f.y = nest.y; }
  world.colony = colony;

  const adults = () => colony.ants.filter((f) => f.alive && f.lifeStage === 'adult');
  const living = () => colony.ants.filter((f) => f.alive);
  let before = null;
  const hatchedAt = { value: 0 };
  const seen = new Set(colony.ants.filter((f) => !f.alive).map((f) => f.id));
  const deathsAfter = {};
  let exposed = 0;
  let shifted = false;
  const steps = Math.ceil(seconds / dt);
  for (let s = 0; s < steps; s++) {
    if (!shifted && world.time >= shiftAt) {
      const ad = adults();
      const oldChem = world.chemistry;
      if (invert) shift(world);
      before = {
        judgmentBefore: mean(ad.map((f) => judgment(f, oldChem))),
        judgmentHit: mean(ad.map((f) => judgment(f, world.chemistry))),
        diversityBefore: living().length > 1 ? diversity(living().map((f) => f.genome)) : 0,
        adultsBefore: ad.length,
      };
      hatchedAt.value = colony.life?.hatched ?? 0;
      exposed = living().length;
      shifted = true;
    }
    const n = colony.ants.length;
    withRng(worldRng, () => stepWorld(world, dt));
    withRng(antRng, () => updateColony(world, colony, dt));
    if (shifted) exposed += colony.ants.length - n;   // hatched after the shift
    for (const f of colony.ants) {
      if (f.alive || seen.has(f.id)) continue;
      seen.add(f.id);
      if (shifted) deathsAfter[f.cause ?? 'unknown'] = (deathsAfter[f.cause ?? 'unknown'] ?? 0) + 1;
    }
    if (colony.life?.extinctAt != null) break;
  }
  const c = census(world, colony);
  const alive = living();
  const breeders = (sex) => alive.some((f) => f.sex === sex && f.lifeStage !== 'senescent');
  const bornAfter = (f) => (world.lineage?.[f.id]?.bornAt ?? -1) >= shiftAt;
  const ad = adults();
  const out = {
    extinct: c.alive === 0 || !breeders('female') || !breeders('male') ? 1 : 0,
    alive: c.alive,
    ...(before ?? { judgmentBefore: null, judgmentHit: null, diversityBefore: null, adultsBefore: 0 }),
    judgmentEnd: mean(ad.map((f) => judgment(f, world.chemistry))),
    judgmentNew: mean(ad.filter(bornAfter).map((f) => judgment(f, world.chemistry))),
    diversityEnd: alive.length > 1 ? diversity(alive.map((f) => f.genome)) : 0,
    hatchedAfter: (colony.life?.hatched ?? 0) - hatchedAt.value,
    poisonAfter: exposed ? (deathsAfter.poison ?? 0) / exposed : null,
    deathsAfter,
    generations: c.generations,
  };
  registerSpecies([]);
  return out;
}
