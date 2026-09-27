// The resin painter.

import { mix } from '../sprite-kit.js';
import { LIGHT, shadow, volume, lustre, patches, circle, cover } from './common.js';

// Resin: thick and translucent. A drop with the tip up, bubbles inside and a
// hanging thread. What it does is stretch time, and it shows in being the only
// thing that seems to move slowly.
export function resin(ctx, cx, cy, r, base, rnd, past) {
  shadow(ctx, cx, cy, r, 0.35);
  const y = cy + r * 0.12;

  ctx.save();
  gota(ctx, cx, cy, y, r);
  ctx.clip();
  volume(ctx, cx, y, r, base, 0.55 - past * 0.3, 0.5);

  bubbles(ctx, cx, y, r, rnd);

  // Dark sediment at the bottom: the thick stuff sinks.
  const residue = ctx.createLinearGradient(0, y, 0, y + r);
  residue.addColorStop(0, 'rgba(70,36,8,0)');
  residue.addColorStop(1, `rgba(70,36,8,${0.3 + past * 0.3})`);
  cover(ctx, residue);

  patches(ctx, cx, y, r, past * 0.6, rnd);
  ctx.restore();

  // The dripping thread, longer the older it is: it has been oozing a while.
  ctx.strokeStyle = mix(base, '#5a2e08', 0.35);
  ctx.lineWidth = Math.max(1, r * 0.13);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.15, y + r * 0.9);
  ctx.lineTo(cx + r * 0.15, y + r * (1.15 + past * 0.35));
  ctx.stroke();
  circle(ctx, cx + r * 0.15, y + r * (1.2 + past * 0.35), r * 0.17, mix(base, '#3b1d05', 0.15));
  ctx.lineWidth = 1;

  lustre(ctx, cx, y - r * 0.15, r, 0.5 - past * 0.3);
}

// The drop's silhouette: tip up and round belly below, at `y`.
function gota(ctx, cx, cy, y, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 1.35);
  ctx.bezierCurveTo(cx + r * 0.45, cy - r * 0.55, cx + r, y - r * 0.35, cx + r, y);
  ctx.arc(cx, y, r, 0, Math.PI);
  ctx.bezierCurveTo(cx - r, y - r * 0.35, cx - r * 0.45, cy - r * 0.55, cx, cy - r * 1.35);
  ctx.closePath();
}

// What it holds inside: trapped bubbles and the odd strand. Amber keeps
// things, just as it keeps hunger for later.
function bubbles(ctx, cx, y, r, rnd) {
  for (let i = 0; i < 4; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.7;
    const rad = r * (0.08 + rnd() * 0.16);
    const bx = cx + Math.cos(a) * d;
    const by = y + Math.sin(a) * d;
    circle(ctx, bx, by, rad, 'rgba(255,240,200,0.18)');
    ctx.strokeStyle = 'rgba(90,50,12,0.22)';
    ctx.beginPath();
    ctx.arc(bx, by, rad, LIGHT + 0.7, LIGHT + 2.7);
    ctx.stroke();
  }
}
