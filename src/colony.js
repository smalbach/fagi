// The colony: Fagi and her sisters (with SEX on, a mixed group).
//
// They share the world: the nest and its pantry, the fruit, the water and the
// trail pheromone. Each has her own body and her own head (fagi.js); what one
// learns reaches the others only through social.js.
//
// In the game, the Fagi you follow is the first one; the panels, the narrator
// and saving what she learned are hers. Her sisters live next to her
// (world.colony) and are drawn around her. In batch every one is measured.
// (`ants` is the name the recordings and the research scripts already use.)

import { SOCIAL } from './config.js';
import { createFagi, updateFagi } from './fagi.js';
import { socialize } from './social.js';
import { ensureBothSexes } from './biology.js';
import { updateLife } from './reproduction.js';

// `first`: an existing Fagi to be #1 (the one the game follows); the rest
// are born here, up to `size`.
export function createColony(size = SOCIAL.size, first = null) {
  const ants = [];
  for (let i = 0; i < size; i++) {
    const f = i === 0 && first ? first : createFagi();
    f.id = i + 1;
    // Sisters don't save what they learned in the browser: that slot is Fagi's.
    if (i > 0) f.sister = true;
    ants.push(f);
  }
  // With sex on, a first population that can breed at all (biology.js).
  ensureBothSexes(ants);
  return {
    ants,
    lastExchange: {},   // 'a-b' -> when those two last exchanged rules
    seenMeal: {},       // id -> the last meal of hers the others already saw
    stats: { exchanges: 0, told: 0, seen: 0 },
  };
}

// Her sisters' turn, after the world and Fagi herself have moved.
export function updateSisters(world, colony, dt) {
  for (const f of colony.ants) if (f.sister) updateFagi(f, world, dt);
  socialize(colony, world, world.time ?? 0);
  updateLife(world, colony, dt);   // with LIFE: mating, eggs, hatching (reproduction.js)
}

// A whole colony for one step, all of them measured alike (batch).
export function updateColony(world, colony, dt) {
  for (const f of colony.ants) updateFagi(f, world, dt);
  socialize(colony, world, world.time ?? 0);
  updateLife(world, colony, dt);
}

// Who the game follows when the one it followed dies (LIFE): her nearest
// living descendant (a child before a grandchild), else any of the population;
// among equals an adult before a juvenile, then the eldest. null if none is left.
export function successorOf(world, colony, dead) {
  const lineage = world.lineage ?? {};
  const gens = (id) => {
    // How many generations below `dead` this one is (0 = not hers).
    const walk = (x, depth) => {
      if (x == null || depth > 8) return 0;
      const l = lineage[x];
      if (!l) return 0;
      if (l.mother === dead.id || l.father === dead.id) return depth;
      return Math.min(...[walk(l.mother, depth + 1), walk(l.father, depth + 1)].map((v) => v || Infinity));
    };
    const g = walk(id, 1);
    return Number.isFinite(g) ? g : 0;
  };
  const alive = colony.ants.filter((f) => f !== dead && f.alive);
  if (!alive.length) return null;
  const rank = (f) => [gens(f.id) || 99, f.lifeStage === 'juvenile' ? 1 : 0, -(f.age + (f.startAge ?? 0)), f.id];
  alive.sort((a, b) => {
    const [ra, rb] = [rank(a), rank(b)];
    for (let k = 0; k < ra.length; k++) if (ra[k] !== rb[k]) return ra[k] - rb[k];
    return 0;
  });
  const next = alive[0];
  const g = gens(next.id);
  return { next, kin: g === 1 ? 'child' : g > 1 ? 'descendant' : 'kin' };
}

// The game keeps one object on screen (main.js hands it to every panel): to
// follow another she and it swap what they are, so every reference by object
// and every id stays true. `keep` are keys the screen's object keeps (the cortex).
export function swapInto(shown, other, keep = ['cortex']) {
  const a = { ...shown };
  const b = { ...other };
  for (const k of Object.keys(shown)) if (!keep.includes(k)) delete shown[k];
  for (const k of Object.keys(other)) delete other[k];
  for (const [k, v] of Object.entries(b)) if (!keep.includes(k)) shown[k] = v;
  Object.assign(other, a);
  for (const k of keep) { if (k in b) other[k] = b[k]; else delete other[k]; }
  shown.sister = false;
  other.sister = true;
}

