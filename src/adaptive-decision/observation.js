// What the adaptive judge may know (docs/research/plan-decision-adaptativa.md,
// step 3): plain data read from her, never live references, never the
// world's hidden state. Not here: what a fruit really does (its spec), whether
// this one is a look-alike, the chemistry, her brain's facts, rules or cues
// (those are the current judgment's learning, not this one's).
//
// Here: how hungry she feels and where the top is, her age, what she carries,
// the pantry as she remembers it, the last bite as she felt it (hunger before
// and after), and a fruit's look (what she sees and smells of it).

import { HUNGER } from '../config.js';
import { cuesOf } from '../learned/cues.js';

export function observe(fagi) {
  const m = fagi.lastMeal;
  return {
    age: fagi.age,
    hunger: fagi.hunger,
    hungerMax: HUNGER.max,
    carrying: fagi.carrying?.type ?? null,
    pantry: { ...(fagi.pantry ?? {}) },
    meal: m ? { n: m.n, key: m.type, before: m.hungerBefore, after: m.hungerAfter } : null,
  };
}

// A fruit's look: color, shape and smell as she perceives them.
export const lookOf = (key) => cuesOf(key);
