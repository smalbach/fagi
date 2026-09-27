// Painted rocks: each rock is drawn ONCE on its own canvas (an in-memory
// image) and then just stamped. That way it can carry stone grain, veins and
// shadow at no cost per frame.
//
// The silhouette is irregular but ALWAYS fits inside the collision radius, so
// what you see and what gets in the way stay the same thing.
//
// There is no "one rock texture": there are materials. Each stone draws one at
// random from its seed, and the material decides color, grain, shape and what
// goes on top —strata, pits, lichen—. Two rocks side by side do not look alike.

// The pieces live in rock-sprite/: the photographic rock, the materials, the
// shape, what goes on top and the painting of the procedural one. Here we only
// choose which one is drawn and keep the already painted canvases.

import { seedFor, detail, stamp } from './sprite-kit.js';
import { realisticRockOf, drawRealisticRock } from './rock-sprite/realistic.js';
import { paintRock } from './rock-sprite/paint.js';

const sprites = new Map();   // key: seed|radius

export function drawRock(ctx, o, spec, r) {
  const seedOf = seedFor(o) >>> 0;
  const realistic = realisticRockOf(seedOf);
  if (realistic) {
    drawRealisticRock(ctx, o, r, realistic.rock, realistic.type, seedOf);
    return;
  }
  // Painted with the radius times the detail scale and stamped at world size:
  // up close the stone has more pixels, not the same ones stretched.
  const z = detail();
  const img = spriteOf(seedFor(o), r * z, spec.color);
  stamp(ctx, img, o.x, o.y, z);
}

function spriteOf(seedOf, r, color) {
  const key = `${seedOf}|${Math.round(r)}|${color}`;
  const saved = sprites.get(key);
  if (saved) return saved;
  const img = paintRock(seedOf, Math.round(r), color);
  sprites.set(key, img);
  return img;
}
