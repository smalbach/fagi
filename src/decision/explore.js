// Tier 4, explore: what's left when no rule answers.

import { habit } from '../habits.js';
import { edibleCount } from '../learned/rules.js';
import { reasonOf } from './common.js';

// No rule has answered: there's no need to ease nor clue to follow.
// So the useful thing is getting to know the map, which is what makes everything else possible
// next time. She forgets whatever she had spotted: there's nothing spotted anymore.
export function exploreRule(fagi, world, ctx) {
  const full = ctx.nest && edibleCount(fagi, fagi.pantry) >= habit(fagi, 'reserve');
  return {
    action: 'explore',
    reason: full
      ? reasonOf('reason.exploreFull')
      : ctx.candidates.length
        ? reasonOf('reason.belowMin', { n: ctx.candidates.length })
        : reasonOf('reason.explore'),
    target: null,
    targetKind: null,
    trailKey: null,
  };
}
