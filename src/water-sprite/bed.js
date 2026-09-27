// The lake bed: what shows of the bottom through the water. Everything is painted
// already clipped to the water and on the still canvas, in the order still.js sets.

import { LAKE } from '../config.js';
import { mix } from '../sprite-kit.js';
import { LIGHT, SAND, outline } from './shape.js';

// Sand in the shallows: a band hugging the shore, broken into patches.
export function sand(ctx, cx, cy, R, rnd) {
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.82 + rnd() * 0.16);
    ctx.globalAlpha = 0.06 + rnd() * 0.1;
    ctx.fillStyle = SAND;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d,
      R * (0.07 + rnd() * 0.1), R * (0.04 + rnd() * 0.06), a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Stones on the bottom: seen through the water, so they're dulled and have their
// highlight where the light comes in. Only near the shore: in the deep water they can't be seen.
export function stones(ctx, cx, cy, R, rnd) {
  for (let i = 0; i < LAKE.stones; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.55 + rnd() * 0.36);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.025 + rnd() * 0.045);
    const sunken = 0.5 + (d / R) * 0.5;      // closer to the shore, sharper
    ctx.globalAlpha = 0.2 + sunken * 0.35;
    ctx.fillStyle = mix('#6b6a5e', '#3b4a4a', rnd() * 0.7);
    ctx.beginPath();
    ctx.ellipse(x, y, rad, rad * (0.6 + rnd() * 0.3), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(214,228,214,0.25)';
    ctx.lineWidth = Math.max(0.4, rad * 0.22);
    ctx.beginPath();
    ctx.ellipse(x, y, rad * 0.82, rad * 0.5, 0, LIGHT - 1.1, LIGHT + 1.1);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

// Algae: dark patches hugging the shore, which is where it's shallow and there's
// enough light. They're what takes away the water's painted-disc look.
export function algae(ctx, cx, cy, R, rnd) {
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.66 + rnd() * 0.3);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.06 + rnd() * 0.12);
    ctx.globalAlpha = 0.1 + rnd() * 0.18;
    ctx.fillStyle = mix('#33523f', '#1d3230', rnd());
    ctx.beginPath();
    for (let j = 0; j <= 12; j++) {
      const b = (j / 12) * Math.PI * 2;
      const rr = rad * (0.6 + Math.sin(b * 3 + a) * 0.25 + rnd() * 0.2);
      const px = x + Math.cos(b) * rr;
      const py = y + Math.sin(b) * rr * 0.8;
      if (j === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// The deep-water drop-off: where the bottom falls away sharply a dark edge shows.
export function deepTier(ctx, ox, oy, R, deep) {
  ctx.globalAlpha = 0.28;
  outline(ctx, ox, oy, R * LAKE.deepFrom, deep, 48);
  const well = ctx.createRadialGradient(ox, oy, R * LAKE.deepFrom * 0.4, ox, oy, R * LAKE.deepFrom);
  well.addColorStop(0, 'rgba(6,20,28,0.4)');
  well.addColorStop(1, 'rgba(6,20,28,0)');
  ctx.fillStyle = well;
  ctx.fill();
  ctx.globalAlpha = 1;
}

// Caustics in the shallows: the web of light the sun draws on the bottom of
// shallow water. Only where the bottom shows —it doesn't reach the deep water—,
// and it's what makes the shore read as SHALLOW water and not as light paint.
export function caustics(ctx, cx, cy, R, rnd) {
  for (let i = 0; i < LAKE.caustics; i++) {
    const a = rnd() * Math.PI * 2;
    const d = R * (0.62 + rnd() * 0.33);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const length = R * (0.05 + rnd() * 0.1);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rnd() * Math.PI);
    ctx.strokeStyle = `rgba(228,246,238,${0.05 + rnd() * 0.08})`;
    ctx.lineWidth = Math.max(0.5, R * 0.007);
    ctx.beginPath();
    ctx.moveTo(-length / 2, 0);
    ctx.quadraticCurveTo(0, length * (rnd() - 0.5) * 0.9, length / 2, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.lineWidth = 1;
}

// Bottom patches: a pond's bottom isn't at the same depth everywhere. A few
// wide, very faint patches are enough for the blue to stop reading as a coat
// of paint.
export function bgPatches(ctx, cx, cy, R, rnd) {
  for (let i = 0; i < 20; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * R * 0.9;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = R * (0.14 + rnd() * 0.26);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const deep = rnd() < 0.55;
    g.addColorStop(0, deep ? 'rgba(10,34,46,0.16)' : 'rgba(126,150,128,0.1)');
    g.addColorStop(1, deep ? 'rgba(10,34,46,0)' : 'rgba(126,150,128,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
}
