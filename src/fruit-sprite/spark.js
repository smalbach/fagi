// The spark painter.

import { toRGB } from '../colors.js';
import { LX, LY, volume, cover, polygon } from './common.js';

// Spark: it is not flesh, it is mineral. A sharp-edged prism that gives off
// glints. What it gives is speed, so it is pointy and not round.
export function spark(ctx, cx, cy, r, base, rnd, past) {
  const [cr, cg, cb] = toRGB(base);

  // Glow: you see it coming from afar even though the piece is small.
  const halo = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2.1);
  halo.addColorStop(0, `rgba(${cr},${cg},${cb},${0.3 - past * 0.2})`);
  halo.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  cover(ctx, halo);

  const pts = carve(cx, cy, r, rnd);

  ctx.save();
  polygon(ctx, pts);
  ctx.clip();
  volume(ctx, cx, cy, r, base, 0.6 - past * 0.3, 0.66);
  faces(ctx, cx, cy, pts, rnd);

  // Glowing core.
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.75);
  core.addColorStop(0, `rgba(255,255,255,${0.5 - past * 0.35})`);
  core.addColorStop(1, 'rgba(255,255,255,0)');
  cover(ctx, core);
  ctx.restore();

  // Rim along the edge and loose glints around it.
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.75)`;
  ctx.lineWidth = Math.max(1, r * 0.12);
  polygon(ctx, pts);
  ctx.stroke();
  ctx.lineWidth = 1;

  sparkles(ctx, cx, cy, r, rnd, past);
}

// The prism's profile, a bit skewed and with each edge doing its own thing.
function carve(cx, cy, r, rnd) {
  const giro = (rnd() - 0.5) * 0.5;
  const profile = [[0, -1.45], [0.62, -0.5], [0.44, 0.7], [0, 1.3], [-0.44, 0.7], [-0.62, -0.5]];
  return profile.map(([px, py]) => {
    const x = px * r * (0.9 + rnd() * 0.25);
    const y = py * r * (0.9 + rnd() * 0.2);
    return {
      x: cx + x * Math.cos(giro) - y * Math.sin(giro),
      y: cy + x * Math.sin(giro) + y * Math.cos(giro),
    };
  });
}

// Faces: from the center to each edge, one light and the next dark. That is
// what makes it cut crystal and not a painted rhombus.
function faces(ctx, cx, cy, pts, rnd) {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const mx = (a.x + b.x) / 2 - cx;
    const my = (a.y + b.y) / 2 - cy;
    const d = Math.hypot(mx, my) || 1;
    const toward = (mx / d) * LX + (my / d) * LY;
    ctx.fillStyle = toward > 0 ? 'rgba(255,255,255,0.22)' : 'rgba(8,14,22,0.28)';
    ctx.globalAlpha = Math.abs(toward) * (0.6 + rnd() * 0.5);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function sparkles(ctx, cx, cy, r, rnd, past) {
  const n = 3 - ((past * 2) | 0);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = r * (1.25 + rnd() * 0.5);
    ctx.strokeStyle = `rgba(255,255,255,${0.18 + rnd() * 0.2})`;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
    ctx.lineTo(cx + Math.cos(a) * (d + r * 0.45), cy + Math.sin(a) * (d + r * 0.45));
    ctx.stroke();
  }
}
