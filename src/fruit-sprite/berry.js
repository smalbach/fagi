// The nectar painter.

import { shadow, volume, lustre, patches, stub, circle } from './common.js';

// Berry: what really feeds. Fleshy, with its groove and its dotted skin.
// When it goes off it sags downward and stops shining.
export function berry(ctx, cx, cy, r, base, rnd, past) {
  const rx = r * (0.93 + rnd() * 0.1 - past * 0.06);
  const ry = r * (0.94 + rnd() * 0.1 + past * 0.05);
  const y = cy + r * past * 0.06;
  shadow(ctx, cx, cy, r);

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  volume(ctx, cx, y, r, base, 0.46 - past * 0.26, 0.55);

  // The groove that splits the berry in two.
  ctx.strokeStyle = 'rgba(14,26,16,0.18)';
  ctx.lineWidth = Math.max(1, r * 0.11);
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.12, y - ry);
  ctx.quadraticCurveTo(cx + rx * 0.5, y, cx - rx * 0.06, y + ry);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Skin pores: light specks, stronger on the lit side.
  for (let i = 0; i < 65; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.85;
    const color = `rgba(255,255,240,${0.06 + rnd() * 0.1})`;
    circle(ctx, cx + Math.cos(a) * d, y + Math.sin(a) * d, Math.max(0.25, r * 0.018), color);
  }

  // Tiny lenticels and freckles follow the skin, not the surrounding shadow.
  for (let i = 0; i < 30; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r * 0.92;
    circle(ctx, cx + Math.cos(a) * d, y + Math.sin(a) * d,
      Math.max(0.2, r * (0.008 + rnd() * 0.014)), 'rgba(49,32,17,0.2)');
  }
  patches(ctx, cx, y, r, past, rnd);
  ctx.restore();

  lustre(ctx, cx, y, r, 0.42 - past * 0.34);
  stub(ctx, cx, y, r, past, rnd);
}
