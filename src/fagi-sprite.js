// Fagi's drawing. It only paints: it knows nothing about rules or decisions.
//
// Fagi is not an animal that exists (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md
// §5.2): an oval mantle with a core that glows with how she is doing, four
// soft filaments she walks on in diagonal pairs, two sensory stalks at the
// front, and side membranes that spread in the heat and fold in the cold.
// What she carries rides on her back. Female and male differ a little in
// shape and hue. Asleep in the open she tucks in and her core breathes slowly;
// dead she curls up, flat and grey, with the core gone dark, so she reads as
// dead by her shape and not only by her color.
//
// She is painted with strokes, not a stored image: the camera zooms her up to
// four times.
//
// The light is the SAME as the ground's, the rock's and the tree's: top left
// of the world. Since the body turns, inside the drawing the light has to
// turn the opposite way (`localLight`), or when she turned around the shine
// would follow her and read as plastic.

import { POINT_TYPES } from './config.js';
import { localLight, shadow } from './fagi-sprite/light.js';
import {
  bodyShape, colorsOf, drawFilaments, drawMembranes, drawMantle, drawSenses, drawCore, drawCargo,
  vitality, coreColor, asleep,
} from './fagi-sprite/entity.js';

export { ellipse } from './fagi-sprite/stroke.js';

export function drawFagi(ctx, fagi) {
  const alive = fagi.alive;
  const step = alive ? fagi.stride * 0.07 : 0;
  const shape = bodyShape(fagi);
  const colors = colorsOf(fagi);

  ctx.save();
  ctx.translate(fagi.x, fagi.y);
  ctx.rotate(fagi.angle);              // +x is forward

  // The world's light, seen from inside the body.
  const L = localLight(fagi.angle);
  shadow(ctx, L, alive);

  // The cold makes her draw in a little; walking rocks her very slightly.
  const cold = alive && fagi.thermalFeel === 'cold' ? 0.94 : 1;
  ctx.scale(cold, cold);
  ctx.rotate(alive && !asleep(fagi) ? Math.sin(step) * 0.03 : 0);

  drawFilaments(ctx, fagi, shape, step, colors);
  drawMembranes(ctx, fagi, shape, colors);
  drawMantle(ctx, fagi, shape, colors, L);
  drawCore(ctx, fagi);
  drawSenses(ctx, fagi, shape, colors, step);
  if (fagi.carrying && POINT_TYPES[fagi.carrying.type]) drawCargo(ctx, POINT_TYPES[fagi.carrying.type], L);

  ctx.restore();
}

// The core's glow, painted over the night (render.js): in the dark she is the
// light she gives off. `dark` is 0 by day, 1 at full night.
export function drawFagiGlow(ctx, fagi, dark) {
  if (!fagi.alive || dark <= 0.02) return;
  const breath = 0.8 + 0.2 * Math.sin((fagi.age ?? 0) * (asleep(fagi) ? 0.9 : 2.2));
  const g = ctx.createRadialGradient(fagi.x, fagi.y, 0, fagi.x, fagi.y, 16);
  g.addColorStop(0, coreColor(vitality(fagi)));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = dark * 0.55 * breath;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(fagi.x, fagi.y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
