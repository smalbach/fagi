// What goes on the stone over its color: each material's own features (strata,
// slabs, pits, lichen, pebbles), the specks and the cracks. Everything is
// painted inside the silhouette clip and uses up the rock's randomness in order.

import { toRGB } from '../colors.js';
import { mix } from '../sprite-kit.js';
import { LIGHT, LX, LY } from './common.js';

// Sandstone strata: parallel layers, a bit skewed, of varying thickness.
export function strata(ctx, S, cx, cy, r, rnd) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rnd() - 0.5) * 0.6);
  let y = -r;
  while (y < r) {
    const tall = r * (0.08 + rnd() * 0.16);
    const clear = rnd() < 0.5;
    ctx.fillStyle = clear
      ? `rgba(255,246,228,${0.04 + rnd() * 0.07})`
      : `rgba(46,32,20,${0.05 + rnd() * 0.1})`;
    ctx.fillRect(-S, y, S * 2, tall);
    y += tall;
  }
  ctx.restore();
}

// Slate slabs: straight planes crossing the stone from side to side, all in
// nearly the same direction, the way it really splits.
export function slabs(ctx, S, cx, cy, r, rnd) {
  const dir = rnd() * Math.PI;
  const n = 2 + ((rnd() * 3) | 0);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = dir + (rnd() - 0.5) * 0.25;
    const off = (rnd() - 0.5) * r * 1.5;
    const nx = Math.cos(a + Math.PI / 2) * off;
    const ny = Math.sin(a + Math.PI / 2) * off;
    const dx = Math.cos(a) * S;
    const dy = Math.sin(a) * S;
    for (const [d, col, w] of [
      [-1.2, `rgba(226,230,240,0.1)`, 1],
      [0, `rgba(12,14,19,0.3)`, Math.max(1, r * 0.05)],
    ]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(cx + nx - dx + d, cy + ny - dy + d);
      ctx.lineTo(cx + nx + dx + d, cy + ny + dy + d);
      ctx.stroke();
    }
  }
}

// Limestone pits: water dissolves it and leaves it pitted. Each pit is shadow
// on top and a light rim below, the reverse of a bump.
export function gaps(ctx, cx, cy, r, rnd) {
  const n = 5 + ((rnd() * 7) | 0);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.8;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = r * (0.05 + rnd() * 0.1);
    ctx.fillStyle = 'rgba(12,13,17,0.34)';
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240,238,230,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x - LX * rad * 0.3, y - LY * rad * 0.3, rad, LIGHT + 0.6, LIGHT + 2.6);
    ctx.stroke();
  }
}

// Lichen: greenish patches stuck to the shaded side, which is where the damp
// lingers. Each patch is several loose circles, never a clean edge.
export function lichen(ctx, cx, cy, r, rnd) {
  const tone = ['#6f7f4a', '#7d8f5c', '#8a9a63', '#5f7350'][(rnd() * 4) | 0];
  const patches = 1 + ((rnd() * 3) | 0);
  for (let m = 0; m < patches; m++) {
    const a = LIGHT + Math.PI + (rnd() - 0.5) * 2.2;
    const d = r * (0.25 + rnd() * 0.5);
    const mx = cx + Math.cos(a) * d;
    const my = cy + Math.sin(a) * d;
    const esc = r * (0.16 + rnd() * 0.22);
    const clumps = 5 + ((rnd() * 7) | 0);
    for (let i = 0; i < clumps; i++) {
      const ga = rnd() * Math.PI * 2;
      const gd = rnd() * esc;
      ctx.fillStyle = `rgba(${toRGB(tone).join(',')},${0.1 + rnd() * 0.14})`;
      ctx.beginPath();
      ctx.arc(mx + Math.cos(ga) * gd, my + Math.sin(ga) * gd, esc * (0.3 + rnd() * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Conglomerate pebbles: rounded bits of other stone set into the matrix. Each
// has its own light and shadow, like real ones.
export function pebbles(ctx, cx, cy, r, rnd) {
  const tones = ['#8d8375', '#6e6a62', '#9c8f78', '#5d6470', '#a49a86'];
  const n = 5 + ((rnd() * 6) | 0);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.72;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rad = r * (0.12 + rnd() * 0.16);
    const tone = tones[(rnd() * tones.length) | 0];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rnd() * Math.PI);
    ctx.scale(1, 0.62 + rnd() * 0.3);   // flattened pebbles, not balls
    const g = ctx.createRadialGradient(LX * rad * 0.4, LY * rad * 0.4, rad * 0.1, 0, 0, rad);
    g.addColorStop(0, mix(tone, '#efeade', 0.35));
    g.addColorStop(1, mix(tone, '#15171c', 0.5));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    // Groove where the pebble sinks into the matrix.
    ctx.strokeStyle = 'rgba(12,13,17,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

// Specks: some shine (quartz) and others are dark pits.
export function specks(ctx, cx, cy, r, rnd, mat) {
  const [nSpecks, shine] = mat.specks;
  const howMany = (nSpecks * (0.6 + rnd() * 0.8)) | 0;
  for (let i = 0; i < howMany; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * r * 0.92;
    const rad = 0.6 + rnd() * (r * 0.06);
    ctx.fillStyle = rnd() < shine
      ? `rgba(255,252,244,${0.05 + rnd() * 0.12})`
      : `rgba(14,15,19,${0.1 + rnd() * 0.22})`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rad, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Cracks: a jagged line with its light reflection beside it, which is what
// makes it read as a crevice and not a painted line.
export function cracks(ctx, cx, cy, r, rnd, mat) {
  const [gmin, gmax] = mat.cracks;
  const howMany = gmin + ((rnd() * (gmax - gmin + 1)) | 0);
  for (let i = 0; i < howMany; i++) {
    let a = rnd() * Math.PI * 2;
    let x = cx + Math.cos(a) * r * 0.75;
    let y = cy + Math.sin(a) * r * 0.75;
    a += Math.PI + (rnd() - 0.5) * 0.9;
    const steps = 3 + ((rnd() * 4) | 0);
    const path = [{ x, y }];
    for (let s = 0; s < steps; s++) {
      a += (rnd() - 0.5) * 1.1;
      const step = r * (0.16 + rnd() * 0.22);
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      path.push({ x, y });
    }
    const traceOf = (dx, dy, col, w) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path[0].x + dx, path[0].y + dy);
      for (let s = 1; s < path.length; s++) ctx.lineTo(path[s].x + dx, path[s].y + dy);
      ctx.stroke();
    };
    traceOf(LX * 0.9, LY * 0.9, 'rgba(236,232,224,0.13)', 1.1);
    traceOf(0, 0, 'rgba(10,11,14,0.42)', Math.max(1, r * 0.045));
  }
}
