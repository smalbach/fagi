// One colony with an informant, measured (docs/research/social-protocol.md).
// Nothing here decides anything: it runs the game's own code and watches.
//
// The informant first lives a whole life alone on the same map (`devSeconds`),
// in its true chemistry ('true') or turned upside down ('false'). What she came
// to believe there (her rules, what each trait meant to her, and the fruit she
// tasted) is what sister #1 of the colony carries, as her own. With 'none',
// sister #1 is as naive as the rest. The other sisters (#2…) are the same in
// the three conditions, born the same, on the same map.
//
// Only the beliefs go: places, trails and things she met point at a world that
// is not this one.
//
// Per colony, over the naive sisters (all but #1):
//   dose        poison taken, in whole fruit (a trial bite counts its portion;
//               a look-alike counts as what it is)
//   judgment    at the end (or at death): would she eat each species of the map
//               (life.js judgment), balanced over poison and the rest
//   alive, lifetime
//   adopted     rules she adopted that came from the informant (their `origin`),
//               directly or through a sister
//   adoptedFalse  of those, false on this map when adopted
//   standingFalse of those, still hers and still false at the end
//   falseShare  standingFalse / adoptedFalse (null if she adopted none false)
//   myths       her live eating rules that are false at the end, whatever their origin
// And of the informant herself: informantJudgment, informantAlive, informantRules
// (what she brought, and how many of those were false here).

import { createWorld, nestOf } from '../../src/world.js';
import { generateMap } from '../../src/mapgen.js';
import { createFagi, updateFagi } from '../../src/fagi.js';
import { stepWorld } from '../../src/simulation.js';
import { createColony, updateColony } from '../../src/colony.js';
import {
  invertChemistry, speciesUnder, registerSpecies, speciesKeys, specOfFruit, tasteCuesOf, isHarmful,
} from '../../src/chemistry.js';
import { cuesOf } from '../../src/learned/cues.js';
import { traitsMatch, upsertRule } from '../../src/learned/rules.js';
import { rng, withRng } from '../../scripts/batch/random.js';
import { judgment } from '../organism/life.js';

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const copy = (x) => JSON.parse(JSON.stringify(x));

// Is an eating rule false on this map (the species registered now)? An 'avoid'
// is false when most of what it covers is not poison; a 'prefer', when most of
// it is. A rule that covers no species of the map, or is not about eating, is
// neither (null).
export function ruleIsFalse(r) {
  if (!r.on?.some((a) => a === 'eat' || a === 'pursue')) return null;
  const covered = speciesKeys().filter((key) => (r.when.key
    ? r.when.key === key
    : traitsMatch(r, key, [...cuesOf(key), ...tasteCuesOf(key)])));
  if (!covered.length) return null;
  const poison = covered.filter((k) => isHarmful(k)).length;
  const bad = r.verdict === 'avoid' ? covered.length - poison : poison;
  return bad > covered.length / 2;
}

function newWorld(mapSeed) {
  return withRng(rng(mapSeed), () => { const w = createWorld(); generateMap(w); return w; });
}

// A whole life alone on this map, in its chemistry or the inverted one: what
// she believes at the end.
function develop({ seed, mapSeed, seconds, inverted, dt }) {
  const world = newWorld(mapSeed);
  if (inverted) {
    world.chemistry = invertChemistry(world.chemistry);
    world.species = world.species.map((sp) => speciesUnder(world.chemistry, sp.spec.traits));
    registerSpecies(world.species);
  }
  const worldRng = rng(seed * 7919 + 1);
  const fagiRng = rng(seed * 104729 + 3);
  const fagi = withRng(fagiRng, () => createFagi());
  for (let s = 0; s < Math.ceil(seconds / dt) && fagi.alive; s++) {
    withRng(worldRng, () => stepWorld(world, dt));
    withRng(fagiRng, () => updateFagi(fagi, world, dt));
  }
  const b = fagi.brain;
  const species = new Set(world.species.map((sp) => sp.key));
  return {
    rules: b.rules.list.filter((r) => !r.retired && !b.rules.quarantined.has(r.id)).map(copy),
    cues: copy(b.cues),
    facts: Object.fromEntries(Object.entries(b.facts).filter(([k]) => species.has(k)).map(([k, v]) => [k, copy(v)])),
  };
}

// She arrives with them as hers, learned before this world's time began.
function install(fagi, beliefs) {
  const b = fagi.brain;
  for (const [k, v] of Object.entries(beliefs.cues)) b.cues[k] = { ...v, lastAt: 0 };
  for (const [k, v] of Object.entries(beliefs.facts)) b.facts[k] = { ...v, lastAt: 0 };
  for (const r of beliefs.rules) {
    const mine = { ...r, learnedAt: 0, origin: `informant/${r.id}` };
    delete mine.revisedAt;
    upsertRule(b.rules, mine);
  }
  b.version = (b.version ?? 0) + 1;
}

export function runColony({ seed, mapSeed, informant, size, devSeconds, seconds, dt = 0.05 }) {
  const beliefs = informant === 'none' ? null
    : develop({ seed, mapSeed, seconds: devSeconds, inverted: informant === 'false', dt });

  // The colony's world registers the map's true species again.
  const world = newWorld(mapSeed);
  const worldRng = rng(seed * 7919);
  const antRng = rng(seed);
  const colony = withRng(antRng, () => createColony(size));
  const nest = nestOf(world);
  for (const f of colony.ants) { f.x = nest.x; f.y = nest.y; }
  world.colony = colony;
  const [teller, ...naive] = colony.ants;
  let brought = null;
  if (beliefs) {
    install(teller, beliefs);
    const verdicts = beliefs.rules.map(ruleIsFalse).filter((v) => v != null);
    brought = { rules: beliefs.rules.length, eating: verdicts.length, false: verdicts.filter(Boolean).length };
  }

  const per = new Map(naive.map((f) => [f.id, { dose: 0, told: 0, adopted: new Map(), endedAt: null }]));
  const steps = Math.ceil(seconds / dt);
  for (let s = 0; s < steps && colony.ants.some((f) => f.alive); s++) {
    const eaten = new Map(naive.map((f) => [f.id, f.eaten]));
    withRng(worldRng, () => stepWorld(world, dt));
    withRng(antRng, () => updateColony(world, colony, dt));
    for (const f of naive) {
      const m = per.get(f.id);
      if (f.eaten !== eaten.get(f.id) && f.lastMeal) {
        const spec = specOfFruit(f.lastMeal.type, f.lastMeal.variant);
        if ((spec?.hunger ?? 0) > 0) m.dose += f.lastEpisode?.portion ?? 1;
      }
      // What she was told this step, if it came from the informant.
      const told = f.brain.lastTold;
      if (told && told.n !== m.told) {
        m.told = told.n;
        for (const id of told.ids) {
          const r = f.brain.rules.list.find((x) => x.id === id);
          if (r?.origin?.startsWith('informant/') && !m.adopted.has(id)) m.adopted.set(id, ruleIsFalse(r));
        }
      }
      if (!f.alive && m.endedAt == null) m.endedAt = world.time;
    }
  }

  const rows = naive.map((f) => {
    const m = per.get(f.id);
    const live = (id) => f.brain.rules.list.find((x) => x.id === id && !x.retired && !f.brain.rules.quarantined.has(x.id));
    const adoptedFalse = [...m.adopted].filter(([, v]) => v === true).map(([id]) => id);
    const standingFalse = adoptedFalse.filter((id) => { const r = live(id); return r && ruleIsFalse(r) === true; });
    const myths = f.brain.rules.list.filter((r) => !r.retired && !f.brain.rules.quarantined.has(r.id) && ruleIsFalse(r) === true).length;
    return {
      dose: m.dose,
      judgment: judgment(f, world.chemistry),
      alive: f.alive ? 1 : 0,
      lifetime: Math.round(Math.min(f.age, seconds) * 10) / 10,
      adopted: m.adopted.size,
      adoptedFalse: adoptedFalse.length,
      standingFalse: standingFalse.length,
      falseShare: adoptedFalse.length ? standingFalse.length / adoptedFalse.length : null,
      myths,
      cause: f.alive ? null : f.cause,
    };
  });
  const adoptedFalse = rows.reduce((a, r) => a + r.adoptedFalse, 0);
  const out = {
    dose: mean(rows.map((r) => r.dose)),
    judgment: mean(rows.map((r) => r.judgment)),
    alive: mean(rows.map((r) => r.alive)),
    lifetime: mean(rows.map((r) => r.lifetime)),
    adopted: mean(rows.map((r) => r.adopted)),
    adoptedFalse: mean(rows.map((r) => r.adoptedFalse)),
    standingFalse: mean(rows.map((r) => r.standingFalse)),
    // Pooled over the colony's naive sisters: of every false rule they adopted
    // from the informant, the share still standing at the end.
    falseShare: adoptedFalse ? rows.reduce((a, r) => a + r.standingFalse, 0) / adoptedFalse : null,
    myths: mean(rows.map((r) => r.myths)),
    informantJudgment: judgment(teller, world.chemistry),
    informantAlive: teller.alive ? 1 : 0,
    brought,
    causes: rows.map((r) => r.cause).filter(Boolean),
  };
  registerSpecies([]);
  return out;
}
