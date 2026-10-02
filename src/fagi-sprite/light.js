// Fagi's light and shadow: the world's light seen from inside the body, the
// chitin's volume, the shining rim, the dark edge and the shadow she casts
// on the ground.

import { mix } from '../sprite-kit.js';

const LIGHT = -Math.PI * 0.72;

// The body turns; the world's light does not. Inside the drawing it has to be
// turned the opposite way so the back always shines on the same side of the map.
export function localLight(angle) {
  const a = LIGHT - angle;
  return { x: Math.cos(a), y: Math.sin(a) };
}

// Volume of a chitin piece: light where the light comes in, its own tone in
// the middle and the dull edge on the other side.
export function shell(ctx, x, y, r, base, L, lightT = 0.42, shadowT = 0.6) {
  const g = ctx.createRadialGradient(
    x + L.x * r * 0.5, y + L.y * r * 0.5, r * 0.08,
    x, y, r * 1.18
  );
  g.addColorStop(0, mix(base, '#fff0d4', lightT));
  g.addColorStop(0.46, base);
  g.addColorStop(1, mix(base, '#150c06', shadowT));
  return g;
}

// The lit rim of a piece: only the arc that faces the light. It is painted with
// the silhouette clip already set, so the stroke eats inward and does not
// thicken the outline.
export function edgeLine(ctx, routeOf, x, y, r, color, alpha, width, L) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  const a = Math.atan2(L.y, L.x);
  ctx.arc(x, y, r * 2.2, a - 1.15, a + 1.15);
  ctx.closePath();
  ctx.clip();
  routeOf(ctx);
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// The piece's edge: a very thin dark line around it. It is what sets the chitin
// off against the ground; without it the gradient just reads as plush.
export function outline(ctx, routeOf, width) {
  routeOf(ctx);
  ctx.strokeStyle = 'rgba(26,13,5,0.55)';
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.lineWidth = 1;
}

// The shadow she casts on the ground: a single blot for the whole body, laid
// out opposite the light. Without it the ant floats. `lift` pushes it further
// out when she stands on stilts.
export function shadow(ctx, L, alive, lift = 1) {
  ctx.save();
  ctx.translate(-L.x * 2.6 * lift, -L.y * 2.6 * lift);
  ctx.rotate(0.06);
  const g = ctx.createRadialGradient(-3, 0, 1.5, -3, 0, 15);
  g.addColorStop(0, `rgba(6,8,11,${alive ? 0.42 : 0.3})`);
  g.addColorStop(0.55, 'rgba(6,8,11,0.18)');
  g.addColorStop(1, 'rgba(6,8,11,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(-3, 0, 15, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
