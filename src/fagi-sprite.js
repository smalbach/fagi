// Fagi's drawing. It only paints: it knows nothing about rules or decisions.
//
// Fagi is an ant, and she is drawn as one: three real parts —gaster,
// mesosoma and head— joined by the petiole, the waist only ants have and
// what gives them away most from above. Six three-segment legs that walk
// in a tripod gait, elbowed antennae —scape and funiculus, like real ones—
// and a green leaf on her back, which gives her character and doubles as
// the logo.
//
// She is painted with strokes, not a stored image: the camera zooms her up to
// four times and a stretched ant would show before anything else.
//
// The light is the SAME as the ground's, the rock's and the tree's: top left
// of the world. Since the body turns, inside the drawing the light has to
// turn the opposite way (`localLight`), or when she turned around the shine
// would follow her and read as plastic.
//
// Each part lives in its own module under `fagi-sprite/`; here they are just
// assembled in order.

import { SKIN, DEAD, LEAF, DEAD_LEAF } from './fagi-sprite/palette.js';
import { localLight, shadow } from './fagi-sprite/light.js';
import { drawLegs } from './fagi-sprite/legs.js';
import { drawBody } from './fagi-sprite/body.js';
import { drawAntennas } from './fagi-sprite/antennae.js';
import { drawCarried } from './fagi-sprite/cargo.js';

export { ellipse } from './fagi-sprite/stroke.js';

export function drawFagi(ctx, fagi) {
  const alive = fagi.alive;
  const c = alive ? SKIN : DEAD;
  const leaf = alive ? LEAF : DEAD_LEAF;
  const step = alive ? fagi.stride * 0.07 : 0;

  ctx.save();
  ctx.translate(fagi.x, fagi.y);
  ctx.rotate(fagi.angle);              // +x is forward

  // The world's light, seen from inside the body.
  const L = localLight(fagi.angle);

  shadow(ctx, L, alive);

  // Walking is not just moving the legs: the body pitches with each tripod. Very
  // little —half a degree— but it is what separates walking from sliding.
  const wobble = alive ? Math.sin(step) * 0.035 : 0;
  ctx.rotate(wobble);

  drawLegs(ctx, step, c, L, alive);
  drawBody(ctx, c, leaf, L, alive);
  drawAntennas(ctx, fagi, step, c, L, alive);
  if (fagi.carrying) drawCarried(ctx, fagi.carrying.type, L);

  ctx.restore();
}
