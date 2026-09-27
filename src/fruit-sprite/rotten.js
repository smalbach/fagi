// The rotten painter.

import { LIGHT, LX, LY, shadow, volume, circle } from './common.js';

// Rotten: it no longer has a shape of its own. An irregular lump, mold clinging
// to the shaded side, sunken pits and fumes. And as its time runs out it
// deflates, until it disappears from the map.
export function rotten(ctx, cx, cy, r, base, rnd, past) {
  const k = 1 - past * 0.28;
  const rr = r * k;
  shadow(ctx, cx, cy, r * 1.05, 0.4);
  puddle(ctx, cx, cy, r, rr, past);

  const pts = deform(cx, cy, rr, rnd);

  ctx.save();
  lump(ctx, pts);
  ctx.clip();
  volume(ctx, cx, cy, rr, base, 0.2, 0.68);   // matte: rot does not shine
  mold(ctx, cx, cy, rr, rnd);
  wells(ctx, cx, cy, rr, rnd);
  ctx.restore();

  mist(ctx, cx, cy, r, rr, rnd);
}

// Juice: what it has let out while falling apart, on the ground around it.
function puddle(ctx, cx, cy, r, rr, past) {
  const g = ctx.createRadialGradient(cx, cy + rr * 0.5, 0, cx, cy + rr * 0.5, r * 1.5);
  g.addColorStop(0, `rgba(46,26,32,${0.3 * (0.4 + past)})`);
  g.addColorStop(1, 'rgba(46,26,32,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy + rr * 0.5, r * 1.5, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
}

// The sagging outline: nine points at uneven distances from the center.
function deform(cx, cy, rr, rnd) {
  const n = 9;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const f = 0.7 + rnd() * 0.3;
    pts.push({ x: cx + Math.cos(a) * rr * f, y: cy + Math.sin(a) * rr * f * 0.95 });
  }
  return pts;
}

// The soft path through those points, without a single corner.
function lump(ctx, pts) {
  const n = pts.length;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < n; i++) {
    const m = pts[(i + 1) % n];
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + m.x) / 2, (pts[i].y + m.y) / 2);
  }
  ctx.closePath();
}

// Mold: greenish clumps stuck to the side that does not see the sun, which is
// where the damp lingers.
function mold(ctx, cx, cy, rr, rnd) {
  for (let m = 0; m < 3; m++) {
    const a = LIGHT + Math.PI + (rnd() - 0.5) * 2;
    const d = rr * (0.2 + rnd() * 0.5);
    const mx = cx + Math.cos(a) * d;
    const my = cy + Math.sin(a) * d;
    for (let i = 0; i < 6; i++) {
      const ga = rnd() * Math.PI * 2;
      const gd = rnd() * rr * 0.4;
      const color = `rgba(150,168,120,${0.1 + rnd() * 0.16})`;
      circle(ctx, mx + Math.cos(ga) * gd, my + Math.sin(ga) * gd, rr * (0.1 + rnd() * 0.16), color);
    }
  }
}

// Pits: where the flesh has sunk. Shadow on top, light rim below.
function wells(ctx, cx, cy, rr, rnd) {
  for (let i = 0; i < 4; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * rr * 0.7;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = rr * (0.12 + rnd() * 0.18);
    circle(ctx, x, y, rad, 'rgba(16,10,14,0.4)');
    ctx.strokeStyle = 'rgba(230,214,208,0.12)';
    ctx.beginPath();
    ctx.arc(x - LX * rad * 0.3, y - LY * rad * 0.3, rad, LIGHT + 0.6, LIGHT + 2.6);
    ctx.stroke();
  }
}

// Fumes: two thin wisps rising. It is what can be smelled from afar.
function mist(ctx, cx, cy, r, rr, rnd) {
  for (let i = 0; i < 2; i++) {
    const x = cx + (i ? rr * 0.45 : -rr * 0.35);
    ctx.strokeStyle = `rgba(190,170,180,${0.1 + rnd() * 0.08})`;
    ctx.lineWidth = Math.max(1, r * 0.1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, cy - rr * 0.7);
    ctx.quadraticCurveTo(x + rr * 0.5, cy - rr * 1.3, x - rr * 0.2, cy - rr * 1.9);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
}
