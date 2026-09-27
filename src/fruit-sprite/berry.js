// El pintor del néctar.

import { shadow, volume, lustre, patches, stub, circle } from './common.js';

// Baya: lo que de verdad alimenta. Carnosa, con su surco y la piel poteada.
// Al pasarse se vence hacia abajo y deja de brillar.
export function berry(ctx, cx, cy, r, base, rnd, past) {
  const rx = r * (1 - past * 0.06);
  const ry = r * (1 + past * 0.05);
  const y = cy + r * past * 0.06;
  shadow(ctx, cx, cy, r);

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  volume(ctx, cx, y, r, base, 0.46 - past * 0.26, 0.55);

  // El surco que parte la baya en dos.
  ctx.strokeStyle = 'rgba(14,26,16,0.18)';
  ctx.lineWidth = Math.max(1, r * 0.11);
  ctx.beginPath();
  ctx.moveTo(cx - rx * 0.12, y - ry);
  ctx.quadraticCurveTo(cx + rx * 0.5, y, cx - rx * 0.06, y + ry);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Poros de la piel: motitas claras, más marcadas por el lado de la luz.
  for (let i = 0; i < 12; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.85;
    const color = `rgba(255,255,240,${0.06 + rnd() * 0.1})`;
    circle(ctx, cx + Math.cos(a) * d, y + Math.sin(a) * d, Math.max(0.5, r * 0.05), color);
  }

  patches(ctx, cx, y, r, past, rnd);
  ctx.restore();

  lustre(ctx, cx, y, r, 0.42 - past * 0.34);
  stub(ctx, cx, y, r, past, rnd);
}
