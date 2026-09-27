// --- the skeleton ---------------------------------------------------------

import { mix, seededRng } from '../sprite-kit.js';
import { LX, LY, trunkCanvas } from './common.js';

// The branches, in coordinates relative to the tree's center. Computed apart
// from whoever paints them because TWO canvases paint them —the trunk's, behind
// the leaves, and the tips', in front— and they must come out identical. One
// skeleton painted twice reads as a branch going into the crown and coming out
// the other side; two similar skeletons read as a tangle.
export function branchesOf(seedOf, R) {
  const rnd = seededRng((seedOf ^ 0x7f4a7c15) >>> 0);
  const tilts = (rnd() - 0.5) * 0.22;
  const x0 = tilts * R;
  const y0 = -R * 0.3;                  // the crotch: where the bole splits
  const secsOf = [];

  const growBy = (x, y, a, length, thickness, level) => {
    const cx = x + Math.cos(a) * length * 0.5 + (rnd() - 0.5) * length * 0.28;
    const cy = y + Math.sin(a) * length * 0.5 + (rnd() - 0.5) * length * 0.28;
    const x2 = x + Math.cos(a) * length;
    const y2 = y + Math.sin(a) * length;
    secsOf.push({ x, y, cx, cy, x2, y2, thickness, level });
    if (level >= 2) return;
    for (const sideOf of [-1, 1]) {
      growBy(x2, y2, a + sideOf * (0.3 + rnd() * 0.45),
        length * (0.52 + rnd() * 0.22), thickness * 0.58, level + 1);
    }
  };

  const n = 4 + ((rnd() * 2) | 0);
  for (let i = 0; i < n; i++) {
    // They fan out upward, none hanging toward the ground.
    const a = -Math.PI / 2 + ((i + 0.5) / n - 0.5) * 2.4 + (rnd() - 0.5) * 0.26;
    // Short on purpose: the branches live INSIDE the crown. A branch sticking out
    // above the leaves does not read as a branch, it reads as a dead tree.
    growBy(x0, y0, a, R * (0.26 + rnd() * 0.12), Math.max(1.6, R * 0.13), 0);
  }
  return { tilts, secsOf, cross: { x: x0, y: y0 } };
}

// Traces the segments that pass the filter. Each carries its highlight on the
// lit side: that is what separates a branch from a painted line.
export function traceBranches(ctx, cx, cy, secsOf, clear, dark, filterFn, alpha = 1) {
  ctx.lineCap = 'round';
  ctx.globalAlpha = alpha;
  for (const s of secsOf) {
    if (filterFn && !filterFn(s)) continue;
    ctx.strokeStyle = dark;
    ctx.lineWidth = s.thickness;
    ctx.beginPath();
    ctx.moveTo(cx + s.x, cy + s.y);
    ctx.quadraticCurveTo(cx + s.cx, cy + s.cy, cx + s.x2, cy + s.y2);
    ctx.stroke();

    if (s.thickness > 1.8) {
      const d = s.thickness * 0.3;
      ctx.strokeStyle = clear;
      ctx.lineWidth = s.thickness * 0.32;
      ctx.beginPath();
      ctx.moveTo(cx + s.x + LX * d, cy + s.y + LY * d);
      ctx.quadraticCurveTo(cx + s.cx + LX * d, cy + s.cy + LY * d,
        cx + s.x2 + LX * d, cy + s.y2 + LY * d);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
}

// The branch tips, to go ON TOP of the leaves. Only the thinnest segments,
// and muted: the point is for wood to peek out between leaves, not to draw a
// skeleton over the crown. The drier the tree, the more they show, which is
// exactly what gives away an old one.
export function paintBranches(seedOf, R, dry) {
  const { S, c, ctx, base } = trunkCanvas(seedOf, R);
  const { secsOf } = branchesOf(seedOf, R);
  traceBranches(ctx, S / 2, S / 2, secsOf,
    mix(base, '#d8bc90', 0.45), mix(base, '#120c07', 0.55),
    (s) => s.level >= 2, 0.4 + dry * 0.5);
  return c;
}
