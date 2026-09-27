// The colony: Fagi and her sisters.
//
// They share the world: the nest and its pantry, the fruit, the water and the
// trail pheromone. Each has her own body and her own head (fagi.js); what one
// learns reaches the others only through social.js.
//
// In the game, the Fagi you follow is the first ant; the panels, the narrator
// and saving what she learned are hers. Her sisters live next to her
// (world.colony) and are drawn around her. In batch every ant is measured.

import { SOCIAL } from './config.js';
import { createFagi, updateFagi } from './fagi.js';
import { socialize } from './social.js';

// `first`: an existing Fagi to be ant #1 (the one the game follows); the rest
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
}

// A whole colony for one step, all of them measured alike (batch).
export function updateColony(world, colony, dt) {
  for (const f of colony.ants) updateFagi(f, world, dt);
  socialize(colony, world, world.time ?? 0);
}
