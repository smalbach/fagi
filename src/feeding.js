// Eating and carrying. The rule is simple: when hungry you eat, when not hungry you work.

import { HUNGER, CARRY, POINT_TYPES } from './config.js';
import { habit } from './habits.js';
import { pointTouching, removePoint } from './world.js';
import { applyEffects } from './effects.js';
import { snapshotBody } from './interoception.js';
import { openEpisode } from './episodes.js';
import { verdict, edibleCount } from './learned/rules.js';

// When hungry she eats it on the spot. When not hungry she picks it up and takes it to the nest:
// that's the difference between eating and working. And with the pantry stocked she doesn't even
// pick it up: hoarding extra is no use, knowing the map is.
export function tryPickOrEat(fagi, world) {
  const p = pointTouching(world, fagi);
  if (!p) return;

  // Whether or not she has to pick it up, she's already on it: it stops being a target to go to.
  // Without this, a point she rejects stays spotted and Fagi circles it forever.
  const release = () => { if (fagi.target === p) { fagi.target = null; fagi.memory = 0; } };

  // She doesn't accidentally eat or pick up something she has already learned is harmful.
  // She only tries it again when it was her deliberate target (curiosity).
  if (verdict(fagi, 'eat', p.type, { deliberate: fagi.target === p }) === 'avoid') { release(); return; }

  // A fruit she has never tasted may be eaten sooner than carried: that is a
  // habit (habits.js), learned from storing what turned out to harm her.
  const tasted = (fagi.brain.facts[p.type]?.tries ?? 0) > 0;
  if (fagi.hunger >= (tasted ? CARRY.eatBelow : habit(fagi, 'tasteAt'))) {
    eat(fagi, p.type);
    removePoint(world, p, 'eaten');
  } else if (verdict(fagi, 'store', p.type) === 'avoid') {
    // Trying it out of curiosity is one thing; filling the pantry with what she believes
    // is bad is another. She leaves it where it is and stops treating it as a target.
    release();
    return;
  } else if (!fagi.carrying && edibleCount(fagi, fagi.pantry) < habit(fagi, 'reserve')) {
    // The fruit keeps the age it already had: storing it preserves it, it doesn't
    // make it younger.
    fagi.carrying = { type: p.type, age: p.age ?? 0 };
    fagi.picked = (fagi.picked ?? 0) + 1;
    removePoint(world, p, 'picked');
  } else {
    release();
    return; // she's already carrying something, or the pantry is stocked: she leaves it where it is
  }

  release();
}

// If she's already carrying a ration it makes no sense to starve while
// looking for another. In an emergency she tries it, just as she would with food on the ground.
export function eatCarried(fagi) {
  if (!fagi.carrying) return false;
  const { type } = fagi.carrying;
  if (!POINT_TYPES[type]) return false;
  fagi.carrying = null;
  eat(fagi, type);
  return true;
}

// Eating is physics: the bite does what it does to the body. What Fagi learns
// from it doesn't come from here or from the food's spec: it comes from comparing how
// she was before with how she feels afterwards (episodes.js).
export function eat(fagi, type) {
  const spec = POINT_TYPES[type];
  const before = snapshotBody(fagi);
  fagi.hunger = Math.min(HUNGER.max, Math.max(0, fagi.hunger + spec.hunger));
  applyEffects(fagi, type);
  const ep = openEpisode(fagi, { action: 'eat', key: type, before });
  fagi.eaten += 1;
  fagi.lastMeal = {
    n: fagi.eaten, type,
    beliefBefore: ep.change.before.value,
    beliefAfter: ep.change.after.value,
    kind: ep.change.kind,
    hungerAfter: fagi.hunger,
    reward: ep.reward,
    sensations: ep.sensations,
  };
}
