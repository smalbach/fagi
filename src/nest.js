// The nest: home, pantry and resting place.

import { CARRY } from './config.js';
import { nestOf, storeInNest, takeFromNest, record } from './world.js';
import { radiusOf } from './obstacles.js';
import { eat } from './feeding.js';
import { weight } from './memory.js';
import { verdict } from './learned/rules.js';
import { storedHarm, spoiledRations } from './habits.js';
import { canEat } from './appetite.js';
import { lineNest } from './things.js';

export function nestUnder(fagi, world) {
  const nestObj = nestOf(world);
  if (!nestObj) return null;
  return Math.hypot(nestObj.x - fagi.x, nestObj.y - fagi.y) <= radiusOf(nestObj) ? nestObj : null;
}

// What happens while inside the nest: she drops her load, eats from the stores
// if she needs to, and rests.
export function useNest(fagi, world) {
  const nestObj = nestUnder(fagi, world);
  if (!nestObj) return null;

  if (fagi.hauling) lineNest(fagi, world, nestObj);   // a thing for the lining (things.js)

  if (fagi.carrying) {
    const t = fagi.carrying.type;
    const total = storeInNest(nestObj, t, fagi.carrying.age ?? 0);
    record(world, 'nest_store', { what: t, age: fagi.carrying.age ?? 0 });
    fagi.stored = (fagi.stored ?? 0) + 1;
    fagi.lastDeposit = { n: fagi.stored, type: t, total };
    fagi.carrying = null;
  }

  // When hungry she draws on the pantry: she picks what she remembers best of what's stored,
  // but never serves something she learned disagrees with her.
  if (fagi.hunger >= CARRY.eatBelow) {
    const saved = Object.keys(nestObj.stock).filter(
      (k) => nestObj.stock[k] > 0 && verdict(fagi, 'eat', k) !== 'avoid' && canEat(fagi, k)
    );
    if (saved.length) {
      const best = saved.reduce((a, b) =>
        (weight(fagi.brain, b) > weight(fagi.brain, a) ? b : a));
      takeFromNest(nestObj, best);
      record(world, 'nest_take', { what: best });
      const firstBite = !(fagi.brain.facts[best]?.tries > 0);
      eat(fagi, best);
      // She had stored it without ever tasting it, and it harms her.
      storedHarm(fagi, best, firstBite, fagi.lastMeal?.reward ?? 0);
      fagi.lastPantry = { n: (fagi.lastPantry?.n ?? 0) + 1, type: best };
    }
  }

  // Rations that spoiled since her last visit: she sees the gap.
  const spoiled = nestObj.spoiled ?? 0;
  if (fagi.spoiledSeen != null) spoiledRations(fagi, spoiled - fagi.spoiledSeen);
  fagi.spoiledSeen = spoiled;

  // She's inside: she sees the pantry with her own eyes. This is the only place
  // where fagi.pantry is written, and that's why finding out costs a visit.
  fagi.pantry = { ...nestObj.stock };
  fagi.pantryAt = fagi.age;

  return nestObj;
}
