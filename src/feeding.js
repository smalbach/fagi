// Eating and carrying. The rule is simple: when hungry you eat, when not hungry you work.

import { HUNGER, THIRST, CARRY, POINT_TYPES, HEALTH, TASTE } from './config.js';
import { atMouth, dominantTaste, noteFlavor, saltBite } from './taste.js';
import { specOfFruit, tasteCuesOf } from './chemistry.js';
import { hurt } from './health.js';
import { habit } from './habits.js';
import { pointTouching, removePoint } from './world.js';
import { applyEffects } from './effects.js';
import { snapshotBody } from './interoception.js';
import { openEpisode } from './episodes.js';
import { verdict } from './learned/rules.js';
import { onAgenda, answered } from './experiment.js';
import { canEat, afterBite, aversive } from './appetite.js';
import { EXPERIMENT } from './config.js';
import { pantryEstimate, roomAtHome } from './larder.js';
import { judge, chewing } from './decision/bite.js';
import { noteMeal } from './learned/conduct.js';
import { learnConduct } from './learned/conduct-learn.js';

// When hungry she eats it on the spot. When not hungry she picks it up and takes it to the nest:
// that's the difference between eating and working. And with the pantry stocked she doesn't even
// pick it up: hoarding extra is no use, knowing the map is.
export function tryPickOrEat(fagi, world) {
  const p = pointTouching(world, fagi);
  if (!p) return;

  // Whether or not she has to pick it up, she's already on it: it stops being a target to go to.
  // Without this, a point she rejects stays spotted and Fagi circles it forever.
  const release = () => { if (fagi.target === p) { fagi.target = null; fagi.memory = 0; } };

  // With the bite point on (DECIDE.eat, decision/bite.js) a judge says what to do with it.
  const j = judge();
  if (j) { judged(fagi, world, p, j.ground(fagi, p)); release(); return; }

  // She doesn't accidentally eat or pick up something she has already learned is harmful.
  // She only tries it again when it was her deliberate target (curiosity).
  if (verdict(fagi, 'eat', p.type, { deliberate: fagi.target === p }) === 'avoid') { release(); return; }

  // A fruit she has never tasted may be eaten sooner than carried: that is a
  // habit (habits.js), learned from storing what turned out to harm her.
  const tasted = (fagi.brain.facts[p.type]?.tries ?? 0) > 0;
  const hungry = fagi.hunger >= (tasted ? CARRY.eatBelow : habit(fagi, 'tasteAt'));
  // Still chewing the last bite, or sick from it (appetite.js): she does not
  // eat it now.
  const mayEat = canEat(fagi, p.type);
  // One of last night's questions, and she came for it: a trial bite.
  if (fagi.target === p && mayEat && fagi.thought?.action === 'taste' && onAgenda(fagi, p.type)) {
    eat(fagi, p.type, { portion: EXPERIMENT.portion, variant: p.variant });
    answered(fagi, p.type);
    removePoint(world, p, 'tasted');
  } else if (hungry && mayEat) {
    eat(fagi, p.type, { variant: p.variant });
    removePoint(world, p, 'eaten');
  } else if (verdict(fagi, 'store', p.type) === 'avoid') {
    // Trying it out of curiosity is one thing; filling the pantry with what she believes
    // is bad is another (and with appetite, neither does she store what puts her off:
    // `aversive` below). She leaves it where it is and stops treating it as a target.
    release();
    return;
  } else if (!fagi.carrying && !p.refuse && pantryEstimate(fagi) < habit(fagi, 'reserve') && roomAtHome(fagi) && !aversive(fagi, p.type)) {
    // The fruit keeps the age it already had: storing it preserves it, it doesn't
    // make it younger.
    fagi.carrying = { type: p.type, age: p.age ?? 0, ...(p.variant ? { variant: p.variant } : {}) };
    fagi.picked = (fagi.picked ?? 0) + 1;
    removePoint(world, p, 'picked');
  } else {
    release();
    return; // she's already carrying something, or the pantry is stocked: she leaves it where it is
  }

  release();
}

// A judge's answer, carried out. The body still has its limit: while she
// handles the last bite, she eats nothing (she stays on it and asks again).
function judged(fagi, world, p, answer) {
  if ((answer === 'eat' || answer === 'taste') && chewing(fagi)) return;
  if (answer === 'eat') {
    eat(fagi, p.type, { variant: p.variant });
    removePoint(world, p, 'eaten');
  } else if (answer === 'taste') {
    eat(fagi, p.type, { portion: EXPERIMENT.portion, variant: p.variant });
    if (onAgenda(fagi, p.type)) answered(fagi, p.type);
    removePoint(world, p, 'tasted');
  } else if (answer === 'carry' && !fagi.carrying) {
    fagi.carrying = { type: p.type, age: p.age ?? 0, ...(p.variant ? { variant: p.variant } : {}) };
    fagi.picked = (fagi.picked ?? 0) + 1;
    removePoint(world, p, 'picked');
  }
}

// If she's already carrying a ration it makes no sense to starve while
// looking for another. In an emergency she tries it, just as she would with food on the ground.
export function eatCarried(fagi) {
  if (!fagi.carrying) return false;
  const { type, variant } = fagi.carrying;
  const j = judge();
  if (!POINT_TYPES[type] || (j ? chewing(fagi) || !j.carried(fagi, type) : !canEat(fagi, type))) return false;
  fagi.carrying = null;
  eat(fagi, type, { variant });
  return true;
}

// Eating is physics: the bite does what it does to the body. What Fagi learns
// from it doesn't come from here or from the food's spec: it comes from comparing how
// she was before with how she feels afterwards (episodes.js).
//
// `hunger` overrides what this bite does to hunger (research/ uses it for
// noisy outcomes: the same fruit does not always do the same).
// `portion` below 1 is a trial bite (experiment.js): that share of the hunger,
// and each effect that much weaker and shorter.
export function eat(fagi, type, { hunger = null, portion: meant = 1, variant = null } = {}) {
  // This very fruit: its kind, or a look-alike of it (TASTE; same look, another mix).
  const spec = specOfFruit(type, variant);
  const before = snapshotBody(fagi);
  // In the mouth (TASTE, taste.js): she may spit most of it out.
  const mouth = atMouth(fagi, type, meant, spec.taste);
  const portion = mouth.portion;
  const added = (hunger ?? spec.hunger) * portion;
  const hungerBefore = fagi.hunger;
  fagi.hunger = Math.min(HUNGER.max, Math.max(0, fagi.hunger + added));
  if (TASTE.enabled) {
    // Salt makes her thirsty, juicy acid quenches a little; spicy burns.
    if (spec.thirst) fagi.thirst = Math.min(THIRST.max, Math.max(0, fagi.thirst + spec.thirst * portion));
    if (spec.burn) hurt(fagi, TASTE.burn * spec.burn * portion, 'burn');
    saltBite(fagi, spec.taste, portion);
  }
  applyEffects(fagi, type, portion, variant ? spec.effects : null);
  if (mouth.spat) fagi.lastSpit = { n: (fagi.lastSpit?.n ?? 0) + 1, key: type, taste: dominantTaste(type, spec.taste), variant };
  // What she learns from this bite, she learns of the tastes it really had.
  if (TASTE.enabled && spec.taste) fagi.brain.tasting = tasteCuesOf(type, spec.taste);
  const ep = openEpisode(fagi, { action: 'eat', key: type, before, portion, taste: mouth.innate });
  fagi.brain.tasting = null;
  if (TASTE.enabled && spec.taste) noteFlavor(fagi, type, spec.taste);
  fagi.eaten += 1;
  const meal = noteMeal(fagi, { key: type, portion, before: hungerBefore, after: fagi.hunger });   // CONDUCT only
  if (meal) learnConduct(fagi, meal);
  afterBite(fagi, ep.reward, added, type);
  if (added > 0) hurt(fagi, HEALTH.poison * portion, 'poison');   // poison harms her too (health.js)
  fagi.lastMeal = {
    n: fagi.eaten, type, variant,
    beliefBefore: ep.change.before.value,
    beliefAfter: ep.change.after.value,
    kind: ep.change.kind,
    hungerBefore,
    hungerAfter: fagi.hunger,
    reward: ep.reward,
    sensations: ep.sensations,
  };
}
