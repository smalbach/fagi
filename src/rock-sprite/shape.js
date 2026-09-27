// The rock's shape: the silhouette, how it is traced and the faces that carve it.

import { LX, LY } from './common.js';
import { SILHOUETTE_MAX } from './materials.js';

// Outline: a few vertices of very different radius, joined by straight runs.
// A stone has faces and edges; a smooth curve looks like an egg. It is also
// squashed along one axis and rotated, so no two silhouettes match.
// Computed once and reused, so clip, faces and rim line up.
export function shape(r, rnd, mat) {
  const [lmin, lmax] = mat.sides;
  const n = lmin + ((rnd() * (lmax - lmin + 1)) | 0);
  const phase = rnd() * Math.PI * 2;
  const giro = rnd() * Math.PI * 2;
  const ex = 1 - rnd() * mat.flattened;   // squashed along the X axis before rotating
  const cg = Math.cos(giro);
  const sg = Math.sin(giro);
  const pts = [];
  for (let i = 0; i < n; i++) {
    // The angle moves too: unevenly spread vertices, faces of different
    // widths.
    const a = ((i + (rnd() - 0.5) * 0.45) / n) * Math.PI * 2;
    const lobe = Math.sin(a * 2 + phase) * 0.07 + Math.sin(a * 3 - phase) * 0.05;
    // With peaks, every other vertex falls short: a sharp edge in between.
    const tooth = mat.picos && i % 2 ? 0.8 : 1;
    const f = (mat.min + rnd() * (SILHOUETTE_MAX - mat.min) + lobe) * tooth;
    const rr = r * Math.max(mat.min, Math.min(SILHOUETTE_MAX, f));
    const x = Math.cos(a) * rr * ex;
    const y = Math.sin(a) * rr;
    pts.push({ x: x * cg - y * sg, y: x * sg + y * cg });
  }
  return pts;
}

export function trace(ctx, pts, cx, cy) {
  ctx.beginPath();
  ctx.moveTo(cx + pts[0].x, cy + pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(cx + pts[i].x, cy + pts[i].y);
  ctx.closePath();
}

// Faces: triangles from the center to each edge. Each one lightens or darkens
// depending on where it faces relative to the light. That is what gives the
// look of a carved block instead of a round blot.
export function faces(ctx, pts, cx, cy, clear, dark, rnd, force) {
  const n = pts.length;
  const hx = cx + (rnd() - 0.5) * 5;   // the inner vertex is not at the center
  const hy = cy + (rnd() - 0.5) * 5;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const d = Math.hypot(mx, my) || 1;
    const toward = (mx / d) * LX + (my / d) * LY;   // 1 = face facing the light
    ctx.fillStyle = toward > 0 ? clear : dark;
    ctx.globalAlpha = Math.abs(toward) * force * (0.7 + rnd() * 0.6);
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(cx + a.x, cy + a.y);
    ctx.lineTo(cx + b.x, cy + b.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Only some edges are marked: if all are drawn you see a pie slice.
  // Scattered, they pass for fracture planes.
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(10,11,14,0.14)';
  for (let i = 0; i < n; i++) {
    if (rnd() > 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(cx + pts[i].x, cy + pts[i].y);
    ctx.stroke();
  }
}
