// The ground's details, one by one. They're used by the baked ground, which sows
// them where the terrain calls for them, and by the close-up detail, which puts
// them back when zooming in. They all rely on the same light: a bright edge on
// one side, shadow on the other.

import { LIGHT, LX, LY, LEAF, BRANCH, DRY, MOSS_T } from './palette.js';

// A pebble: it isn't a dot, it's a small stone. What gives it away is a bright
// edge where the light hits and a shadow hugging the other side.
export function pebble(ctx, x, y, r, rnd) {
  // Half buried: barely lighter than the earth. If it stands out, it stops being
  // a stone in the ground and looks like something dropped on top.
  const gray = 52 + ((rnd() * 34) | 0);
  const turn = rnd() * Math.PI;
  const flat = 0.5 + rnd() * 0.45;

  ctx.fillStyle = 'rgba(10,12,15,0.34)';
  ctx.beginPath();
  ctx.ellipse(x - LX * r * 0.45, y - LY * r * 0.45, r * 1.05, r * flat * 1.05, turn, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgb(${gray},${gray - 2},${(gray * 0.92) | 0})`;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * flat, turn, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(${gray + 46},${gray + 44},${gray + 36},0.34)`;
  ctx.lineWidth = Math.max(0.5, r * 0.26);
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.85, r * flat * 0.85, turn, LIGHT - 1.1, LIGHT + 1.1);
  ctx.stroke();
}

// A tuft: three or four blades sprouting from the same spot, curved and of
// different heights. They all rest on a small shadow, otherwise they float.
export function bush(ctx, x, y, tall, rnd) {
  ctx.fillStyle = 'rgba(12,16,12,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y, tall * 0.4, tall * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  const blades = 2 + ((rnd() * 3) | 0);
  const tone = LEAF[(rnd() * LEAF.length) | 0];
  ctx.lineCap = 'round';
  for (let i = 0; i < blades; i++) {
    const a = -Math.PI / 2 + (rnd() - 0.5) * 1.5;
    const length = tall * (0.6 + rnd() * 0.8);
    const cx = x + Math.cos(a) * length * 0.5 + (rnd() - 0.5) * length * 0.4;
    const cy = y + Math.sin(a) * length * 0.5;
    ctx.strokeStyle = tone;
    ctx.globalAlpha = 0.45 + rnd() * 0.4;
    ctx.lineWidth = Math.max(0.7, tall * 0.12);
    ctx.beginPath();
    ctx.moveTo(x + (rnd() - 0.5) * 2, y);
    ctx.quadraticCurveTo(cx, cy, x + Math.cos(a) * length, y + Math.sin(a) * length);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Litter: twigs and dry leaves scattered on the ground. They break the feeling
// of a uniform carpet more than any texture.
export function litter(ctx, x, y, length, rnd) {
  const a = rnd() * Math.PI * 2;
  ctx.strokeStyle = BRANCH[(rnd() * BRANCH.length) | 0];
  ctx.globalAlpha = 0.5 + rnd() * 0.4;
  ctx.lineWidth = 0.8 + rnd();
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  // A twig isn't straight: it bends once.
  const mx = x + Math.cos(a) * length * 0.6;
  const my = y + Math.sin(a) * length * 0.6;
  ctx.lineTo(mx, my);
  const b = a + (rnd() - 0.5) * 1.2;
  ctx.lineTo(mx + Math.cos(b) * length * 0.5, my + Math.sin(b) * length * 0.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// A fallen leaf. Twig litter alone isn't enough: what really covers a forest
// floor is leaves, and each one reads by its shape —tip, vein and its shadow
// underneath— even if it's four pixels long.
export function leaf(ctx, x, y, length, rnd) {
  const width = length * (0.3 + rnd() * 0.2);
  const turn = rnd() * Math.PI;
  const tone = DRY[(rnd() * DRY.length) | 0];

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);

  const shape = (dx, dy) => {
    ctx.beginPath();
    ctx.moveTo(-length / 2 + dx, dy);
    ctx.quadraticCurveTo(dx, -width + dy, length / 2 + dx, dy);
    ctx.quadraticCurveTo(dx, width + dy, -length / 2 + dx, dy);
    ctx.closePath();
  };

  // Its shadow: the leaf lies ON TOP of the earth, not printed into it.
  ctx.fillStyle = 'rgba(10,12,15,0.3)';
  shape(-LX * length * 0.1, -LY * length * 0.1 + length * 0.06);
  ctx.fill();

  ctx.globalAlpha = 0.55 + rnd() * 0.35;
  ctx.fillStyle = tone;
  shape(0, 0);
  ctx.fill();

  // The vein, and the bright edge where the leaf curls toward the light.
  ctx.strokeStyle = 'rgba(28,20,10,0.4)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-length * 0.45, 0);
  ctx.lineTo(length * 0.45, 0);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(228,208,168,0.22)';
  ctx.beginPath();
  ctx.moveTo(-length * 0.42, -width * 0.28);
  ctx.quadraticCurveTo(0, -width * 0.8, length * 0.42, -width * 0.22);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Moss: a low carpet of clumps, not blades. It grows in low, damp spots,
// which is where the sun doesn't reach and it doesn't dry out.
export function moss(ctx, x, y, r, rnd) {
  const tone = MOSS_T[(rnd() * MOSS_T.length) | 0];
  const clumps = 8 + ((rnd() * 10) | 0);
  for (let i = 0; i < clumps; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r;
    const gx = x + Math.cos(a) * d;
    const gy = y + Math.sin(a) * d * 0.7;
    const rad = r * (0.16 + rnd() * 0.26);
    // Each clump with its lit side: a flat patch would read as paint.
    ctx.fillStyle = tone;
    ctx.globalAlpha = 0.16 + rnd() * 0.2;
    ctx.beginPath();
    ctx.arc(gx, gy, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(186,206,150,0.14)';
    ctx.beginPath();
    ctx.arc(gx + LX * rad * 0.3, gy + LY * rad * 0.3, rad * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// A broken path of `length` starting at (x, y): between `steps` and
// `steps + variation - 1` segments, each bent up to `kink` radians
// from the previous one. Shared by the root and the crack.
function brokenPath(x, y, length, steps, variation, kink, rnd) {
  let a = rnd() * Math.PI * 2;
  const path = [{ x, y }];
  const n = steps + ((rnd() * variation) | 0);
  for (let s = 0; s < n; s++) {
    a += (rnd() - 0.5) * kink;
    x += Math.cos(a) * (length / n);
    y += Math.sin(a) * (length / n);
    path.push({ x, y });
  }
  return path;
}

// Strokes the path offset by (dx, dy). Without `cap` it keeps whatever line cap
// the context already had.
function trace(ctx, path, dx, dy, col, w, cap) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  if (cap) ctx.lineCap = cap;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(path[0].x + dx, path[0].y + dy);
  for (let s = 1; s < path.length; s++) ctx.lineTo(path[s].x + dx, path[s].y + dy);
  ctx.stroke();
}

// An exposed root: the back of a root that crosses the ground and dives back
// under. Lighter on top, with its shadow hugging underneath.
export function root(ctx, x, y, length, rnd) {
  const path = brokenPath(x, y, length, 3, 3, 0.9, rnd);
  const thickness = 1.4 + rnd() * 2.2;
  trace(ctx, path, -LX * thickness * 0.5, -LY * thickness * 0.5, 'rgba(10,11,14,0.3)', thickness * 1.2, 'round');
  trace(ctx, path, 0, 0, 'rgba(58,42,26,0.55)', thickness, 'round');
  trace(ctx, path, LX * thickness * 0.3, LY * thickness * 0.3, 'rgba(142,116,76,0.28)', thickness * 0.4, 'round');
}

// Dry-earth crack: a dark broken line with its bright highlight beside it.
// Just like on the rock, the highlight is what makes it a fissure and not a scratch.
export function crack(ctx, x, y, length, rnd) {
  const path = brokenPath(x, y, length, 4, 5, 1.3, rnd);
  trace(ctx, path, LX, LY, 'rgba(180,170,148,0.1)', 1);
  trace(ctx, path, 0, 0, 'rgba(12,13,16,0.3)', 1.3);
}
