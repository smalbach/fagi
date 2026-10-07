// Pieces shared by the fruits: the light, the shadow on the ground, the volume,
// the highlight, the patches of going off and the stalk with its leaf. And the
// loose strokes every painter repeats.

import { mix } from '../sprite-kit.js';

export const LIGHT = -Math.PI * 0.72;   // the same light as the ground, the rock and the nest
export const LX = Math.cos(LIGHT);
export const LY = Math.sin(LIGHT);

// --- strokes --------------------------------------------------------------

// A filled circle.
export function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// Paints the whole canvas: with the clip set, it only lands inside the piece.
export function cover(ctx, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// The closed path joining a list of points.
export function polygon(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
}

// --- pieces ---------------------------------------------------------------

// The shadow it leaves on the ground. There are TWO: the long, soft one the
// light throws to the opposite side, and the short, hard contact one, right
// underneath, where no light gets in from anywhere. Without the second the
// piece floats no matter how well it is painted.
export function shadow(ctx, cx, cy, r, force = 0.45) {
  blurred(ctx, cx - LX * r * 0.3, cy - LY * r * 0.3 + r * 0.55, 0.38, r * 1.2, '6,8,11', force);
  blurred(ctx, cx, cy + r * 0.62, 0.34, r * 0.62, '4,5,7', force * 1.5);
}

// A round blot that fades toward the edge, squashed against the ground.
function blurred(ctx, x, y, squash, rad, rgb, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, squash);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  circle(ctx, 0, 0, rad, g);
  ctx.restore();
}

// Ball volume: light where the light comes in, dark on the other side. Called
// with the silhouette clip already set.
export function volume(ctx, cx, cy, r, base, lightT = 0.45, shadowT = 0.58) {
  const g = ctx.createRadialGradient(
    cx + LX * r * 0.45, cy + LY * r * 0.45, r * 0.08,
    cx, cy, r * 1.2
  );
  g.addColorStop(0, mix(base, '#ffffff', lightT));
  g.addColorStop(0.5, base);
  g.addColorStop(1, mix(base, '#0d1015', shadowT));
  cover(ctx, g);

  // Ground bounce: the soil gives back some light, so the shaded side is not
  // black, it is brown. That is what ties the piece to the spot where it lies,
  // instead of leaving it cut out on top.
  const echo = ctx.createRadialGradient(
    cx - LX * r * 0.7, cy - LY * r * 0.7, r * 0.05,
    cx - LX * r * 0.5, cy - LY * r * 0.5, r * 1.05
  );
  echo.addColorStop(0, 'rgba(126,106,72,0.2)');
  echo.addColorStop(1, 'rgba(126,106,72,0)');
  cover(ctx, echo);
}

// The highlight. An elongated spot set edge-on to the light: it is what makes
// a ball look wet instead of flat.
export function lustre(ctx, cx, cy, r, force) {
  if (force <= 0.02) return;
  ctx.save();
  ctx.translate(cx + LX * r * 0.44, cy + LY * r * 0.44);
  ctx.rotate(LIGHT + Math.PI / 2);
  const sheen = ctx.createRadialGradient(-r * 0.04, 0, 0, 0, 0, r * 0.34);
  sheen.addColorStop(0, `rgba(255,255,245,${force})`);
  sheen.addColorStop(0.35, `rgba(255,255,245,${force * 0.6})`);
  sheen.addColorStop(1, 'rgba(255,255,245,0)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.32, r * 0.17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// The patches of something going off: first speckles, then sunken areas.
// They go inside the piece's clip.
export function patches(ctx, cx, cy, r, past, rnd) {
  if (past <= 0) return;
  const n = 2 + ((past * 6) | 0);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.8;
    const rad = r * (0.12 + rnd() * 0.24) * (0.5 + past * 0.8);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(48,30,22,${0.2 + past * 0.4})`);
    g.addColorStop(1, 'rgba(48,30,22,0)');
    circle(ctx, x, y, rad, g);
  }
}

// Stalk and leaf: what says this fell from a tree. Both dry out.
export function stub(ctx, cx, cy, r, past, rnd) {
  const sideOf = rnd() < 0.5 ? -1 : 1;
  ctx.strokeStyle = mix('#6b4a2f', '#3a2a1a', past);
  ctx.lineWidth = Math.max(1, r * 0.17);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.82);
  ctx.quadraticCurveTo(cx + sideOf * r * 0.1, cy - r * 1.15, cx + sideOf * r * 0.3, cy - r * 1.24);
  ctx.stroke();
  ctx.lineWidth = 1;

  ctx.save();
  ctx.translate(cx + sideOf * r * 0.3, cy - r * 1.2);
  ctx.rotate(sideOf * -0.45);
  ctx.fillStyle = mix('#4fa05a', '#8a6b3a', Math.min(1, past * 1.3));
  ctx.beginPath();
  ctx.ellipse(sideOf * r * 0.3, 0, r * 0.34, r * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,34,20,0.35)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(sideOf * r * 0.6, 0);
  ctx.stroke();
  ctx.restore();
}
