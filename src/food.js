// Fruit ages. Once its time is up it rots: its type changes to toxic and from
// that moment on EVERYTHING about it (effect, reward, aroma, color) comes from the
// toxic spec. Fagi doesn't know that: she only learns when she tries it.
//
// Rot has its own clock too: when the toxic's life runs out it
// falls apart and leaves the map, plume and all.

import { POINT_TYPES, FRUIT, TREE } from './config.js';
import { removePoint, record } from './world.js';
import { sowFrom } from './trees.js';

export function updateFood(world, dt) {
  // Back to front: some get removed along the way.
  for (let i = world.points.length - 1; i >= 0; i--) {
    const p = world.points[i];
    p.age = (p.age ?? 0) + dt;

    const life = POINT_TYPES[p.type].life ?? 0;
    if (life <= 0 || p.age < life) continue;

    // Rot doesn't rot again: it disappears.
    if (p.type === FRUIT.rot) {
      removePoint(world, p, 'rotted');
      sowFrom(world, p);   // its seed, if trees come and go (TREE.seed)
      continue;
    }

    if (TREE.seed) p.was = p.type;   // what its seed will grow
    p.type = FRUIT.rot;
    p.age = 0;
    p.rotten = true;
    record(world, 'point_rot', { id: p.id, what: p.type });
    // The trail isn't erased: it carries on where it was going, but from now on
    // it smells and looks like what it is. smell.js takes care of that.
  }
}

// 0 = just fallen, 1 = about to rot (or to disappear, if it's already
// rotten). Used for drawing.
export function ripeness(p) {
  const life = POINT_TYPES[p.type].life ?? 0;
  if (life <= 0) return 0;
  return Math.min(1, (p.age ?? 0) / life);
}
