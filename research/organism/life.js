// One life of the organism, measured (§18.3). Nothing here decides anything:
// it runs the game's own code and watches.
//
//   lifetime   seconds she lived (the whole run if she survived)
//   alive      1 if she was alive at the end
//   safe       share of her life with hunger and thirst under NEEDS.critical
//   stressed   seconds with thermal stress
//   dose       poison taken, in whole fruit (a trial bite counts its portion)
//   firstHarm  harmful kinds she met by mouth
//   repeated   whole harmful bites of a kind she had already bitten
//   judgment   rules plus aversion over the 96 looks of the catalogue, at the
//              end, against the chemistry of the end: would she eat it?
//              (balanced over poison and the rest)
//   helpful    share of the map's helpful kinds she found
//   postDose   poison taken after the shift (0 in a steady world)
//   postRate   that, per second she lived after the shift (null if she did not)
//   cause      what she died of, or null

import { createWorld } from '../../src/world.js';
import { generateMap } from '../../src/mapgen.js';
import { createFagi, updateFagi } from '../../src/fagi.js';
import { stepWorld } from '../../src/simulation.js';
import { NEEDS, HUNGER, THIRST } from '../../src/config.js';
import {
  TRAITS, speciesKey, cuesOfTraits, feedOf, isHarmful, isHelpful, invertChemistry, speciesUnder, registerSpecies,
} from '../../src/chemistry.js';
import { verdict } from '../../src/learned/rules.js';
import { aversive } from '../../src/appetite.js';
import { rng, withRng } from '../../scripts/batch/random.js';

const CATALOGUE = [];
for (const color of TRAITS.color) for (const shape of TRAITS.shape) for (const smell of TRAITS.smell) CATALOGUE.push({ color, shape, smell });

export function judgment(f, chem) {
  let hit = 0; let miss = 0; let fa = 0; let ok = 0;
  for (const t of CATALOGUE) {
    const key = speciesKey(t);
    const cues = cuesOfTraits(t);
    const avoids = verdict(f, 'pursue', key, { traits: cues }) === 'avoid' || aversive(f, key, cues);
    if (feedOf(chem, t) === 'poison') { if (avoids) hit++; else miss++; } else if (avoids) fa++; else ok++;
  }
  return ((hit + miss ? hit / (hit + miss) : 1) + (fa + ok ? ok / (fa + ok) : 1)) / 2;
}

// The world turns upside down: same fruit, the other chemistry.
function shift(world) {
  const chem = invertChemistry(world.chemistry);
  world.chemistry = chem;
  world.species = world.species.map((sp) => speciesUnder(chem, sp.spec.traits));
  registerSpecies(world.species);
}

export function runLife({ fagiSeed, mapSeed, seconds, shiftAt = null, dt = 0.05 }) {
  const world = withRng(rng(mapSeed), () => { const w = createWorld(); generateMap(w); return w; });
  const worldRng = rng(fagiSeed * 7919);
  const fagiRng = rng(fagiSeed);
  const fagi = withRng(fagiRng, () => createFagi());
  const bitten = new Set();
  let safe = 0; let stressed = 0; let dose = 0; let postDose = 0; let firstHarm = 0; let repeated = 0; let shifted = false;
  const steps = Math.ceil(seconds / dt);
  for (let s = 0; s < steps && fagi.alive; s++) {
    if (shiftAt != null && !shifted && world.time >= shiftAt) { shift(world); shifted = true; }
    withRng(worldRng, () => stepWorld(world, dt));
    const eaten = fagi.eaten;
    withRng(fagiRng, () => updateFagi(fagi, world, dt));
    if (fagi.hunger / HUNGER.max < NEEDS.critical && fagi.thirst / THIRST.max < NEEDS.critical) safe += dt;
    if ((fagi.thermalStress ?? 0) > 0) stressed += dt;
    if (fagi.eaten === eaten || !fagi.lastMeal) continue;
    const key = fagi.lastMeal.type;
    const portion = fagi.lastEpisode?.portion ?? 1;
    if (isHarmful(key)) {
      dose += portion;
      if (shifted) postDose += portion;
      if (!bitten.has(key)) firstHarm += 1;
      else if (portion === 1) repeated += 1;
    }
    bitten.add(key);
  }
  const helpfulKinds = world.species.map((sp) => sp.key).filter((k) => isHelpful(k));
  const out = {
    lifetime: Math.round(Math.min(fagi.age, seconds) * 10) / 10,
    alive: fagi.alive ? 1 : 0,
    safe: fagi.age > 0 ? safe / fagi.age : 0,
    stressed,
    dose, firstHarm, repeated, postDose,
    postRate: shiftAt != null && fagi.age > shiftAt ? postDose / (Math.min(fagi.age, seconds) - shiftAt) : null,
    judgment: judgment(fagi, world.chemistry),
    helpful: helpfulKinds.length ? helpfulKinds.filter((k) => bitten.has(k)).length / helpfulKinds.length : 0,
    cause: fagi.alive ? null : fagi.cause,
  };
  registerSpecies([]);
  return out;
}
