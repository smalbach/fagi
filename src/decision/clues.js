// Clues of something she already perceived and lost, from the freshest to the oldest.

import { labelOf } from '../i18n.js';
import { reasonOf, pantryDone, stillInWorld } from './common.js';
import { bareTree } from '../perception.js';

// She lost the scent she was following: she doesn't drop it at once, she searches for it by sweeping.
export function persistOnScent(fagi, world, ctx, dt) {
  if (!fagi.trailKey || fagi.trailMemory <= 0) return null;
  // Water always deserves the trail; a food smell doesn't if there's nowhere to
  // put it: trackScent revives trailMemory inside the plume, so without
  // this way out she'd keep tracking the same fruit forever.
  if (fagi.trailKey !== 'water' && pantryDone(fagi, ctx)) return null;
  return {
    action: 'track',
    reason: reasonOf('reason.lostTrail', {
      what: labelOf(fagi.trailKey),
      sec: { dur: fagi.trailMemory, precise: true },
    }),
    targetKind: 'scent',
    trailKey: fagi.trailKey,
  };
}

// She had it spotted and lost sight of it (walked past it, it ended up behind a rock).
export function persistFromMemory(fagi, world, ctx, dt) {
  // A tree she has just found bare is nothing to keep going to.
  const stillThere = fagi.target && stillInWorld(world, fagi.target) && !bareTree(fagi, fagi.target);
  if (!stillThere || fagi.memory <= 0) return null;
  fagi.memory -= dt;
  return {
    action: 'memory',
    reason: reasonOf('reason.memory', { sec: { dur: fagi.memory, precise: true } }),
    target: fagi.target,
    targetKind: fagi.targetKind,
  };
}
