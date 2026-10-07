// The spark painter.

import { toRGB } from '../colors.js';
import { LX, LY, volume, cover, polygon, shadow } from './common.js';

// Spark: it is not flesh, it is mineral. A sharp-edged prism that gives off
// glints. What it gives is speed, so it is pointy and not round.
export function spark(ctx, cx, cy, r, base, rnd, past) {
  const [cr, cg, cb] = toRGB(base);

  // Reflected light and a contact shadow, rather than self-emission.
  shadow(ctx, cx, cy, r, 0.38);

  const pts = carve(cx, cy, r, rnd);

  ctx.save();
  polygon(ctx, pts);
  ctx.clip();
  volume(ctx, cx, cy, r, base, 0.6 - past * 0.3, 0.66);
  faces(ctx, cx, cy, pts, rnd);
  ctx.lineWidth = Math.max(0.3, r * 0.015);
  for (let i = 0; i < 10; i++) {
    const x = cx + (rnd() - 0.5) * r, y = cy + (rnd() - 0.5) * r * 1.8;
    ctx.strokeStyle = i % 2 ? '#e4e9df38' : '#1c303b40';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.14, y + r * 0.28); ctx.stroke();
  }

  // Light scattered through the crystal.
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.75);
  core.addColorStop(0, `rgba(255,255,255,${0.18 - past * 0.12})`);
  core.addColorStop(1, 'rgba(255,255,255,0)');
  cover(ctx, core);
  ctx.restore();

  // Rim along the edge and loose glints around it.
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.75)`;
  ctx.lineWidth = Math.max(0.4, r * 0.035);
  polygon(ctx, pts);
  ctx.stroke();
  ctx.lineWidth = 1;


}

// The prism's profile, a bit skewed and with each edge doing its own thing.
function carve(cx, cy, r, rnd) {
  const turn = (rnd() - 0.5) * 0.5;
  const profile = [[0, -1.45], [0.62, -0.5], [0.44, 0.7], [0, 1.3], [-0.44, 0.7], [-0.62, -0.5]];
  return profile.map(([px, py]) => {
    const x = px * r * (0.9 + rnd() * 0.25);
    const y = py * r * (0.9 + rnd() * 0.2);
    return {
      x: cx + x * Math.cos(turn) - y * Math.sin(turn),
      y: cy + x * Math.sin(turn) + y * Math.cos(turn),
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
