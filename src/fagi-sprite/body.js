// Fagi's body: gaster, leaf, petiole, mesosoma and head, in that order, which
// is back to front and bottom to top.

import { mix, seededRng } from '../sprite-kit.js';
import { shade, setae } from './light.js';
import { gasterPath, mesosomaPath, GASTER, MESOSOMA_PLATES, MESOSOMA_SUTURES } from './silhouettes.js';
import { ellipse, point, arc } from './stroke.js';
import { drawLeaf } from './leaf.js';
import { head } from './head.js';

// Fixed randomness: the pits and hairs must come out the SAME every frame,
// or the ant would shimmer.
const GRAIN = 0x5f3a1c7b;

// `fill` scales the gaster from where it joins the waist: wider on a female,
// slimmer on a male, and shrunk when she is starving, since an ant's gaster is
// where the food she has eaten goes.
// `shape` (fagi-sprite.js, shapeOf): how big her thorax and head are drawn.
export function drawBody(ctx, c, leaf, L, alive, fill = { x: 1, y: 1 }, shape = null) {
  const rnd = seededRng(GRAIN);

  ctx.save();
  ctx.translate(-3.5, 0);
  ctx.scale(fill.x, fill.y);
  ctx.translate(3.5, 0);
  gaster(ctx, c, L, alive, rnd);
  drawLeaf(ctx, leaf, L);
  ctx.restore();
  petiole(ctx, c, L, alive);
  scaledAt(ctx, 2.0, shape?.thorax ?? 1, () => mesosoma(ctx, c, L, alive, rnd));
  // The head grows from the neck forward.
  scaledAt(ctx, 5.7, shape?.head ?? 1, () => head(ctx, c, L, alive, rnd, shape?.eyes ?? 1));
}

// Draws `paint` scaled by `k` about the point (x, 0) of the body's axis.
export function scaledAt(ctx, x, k, paint) {
  if (k === 1) return paint();
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(k, k);
  ctx.translate(-x, 0);
  paint();
  ctx.restore();
}

// The gaster: the big piece, and the one that catches the most light.
function gaster(ctx, c, L, alive, rnd) {
  const { x, rx, ry } = GASTER;
  shade(ctx, gasterPath, x, 0, rx, ry, c.gaster, L, { alive, gloss: 1, glow: 0.34 });

  ctx.save();
  gasterPath(ctx);
  ctx.clip();
  tergites(ctx, c, alive);
  pits(ctx, rnd, x, rx * 0.95, ry * 0.9, 60);
  ctx.restore();

  if (alive) setae(ctx, rnd, 26, x, 0, rx * 0.95, ry * 0.85, 0.7, 0.16);
}

// Tergites: the abdomen's plates. Each one overlaps the one behind, so the
// seam bows toward the tail. The back rim of each plate is thin and lets the
// light through —a pale amber band— and it casts a hairline of shade on the
// next one. Painted strongly they would read as the stripes of a ball.
function tergites(ctx, c, alive) {
  ctx.lineCap = 'butt';
  const rim = alive ? mix(c.gaster, '#ffc27a', 0.5) : mix(c.gaster, '#c8ccd4', 0.3);
  for (const [x, ry] of [[-7.4, 4.8], [-10.4, 4.6], [-13.0, 3.6]]) {
    ctx.globalAlpha = 0.3;
    arc(ctx, x + 2.55, 0, 2.2, ry, Math.PI * 0.64, Math.PI * 1.36, rim, 0.55);
    ctx.globalAlpha = 1;
    arc(ctx, x + 2.2, 0, 2.2, ry, Math.PI * 0.64, Math.PI * 1.36, 'rgba(36,14,4,0.22)', 0.25);
  }
  ctx.lineCap = 'round';
}

// Microsculpture: fine pitting, no two dots alike.
function pits(ctx, rnd, cx, rx, ry, n) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd());
    const color = rnd() < 0.65
      ? `rgba(48,20,6,${0.04 + rnd() * 0.08})`
      : `rgba(255,232,196,${0.03 + rnd() * 0.05})`;
    point(ctx, cx + Math.cos(a) * d * rx, Math.sin(a) * d * ry, 0.12 + rnd() * 0.16, color);
  }
}

// The petiole: a thin stalk with one upright scale-like knot. It is the trait
// only ants have, and from above it is what separates the gaster from the
// thorax.
function petiole(ctx, c, L, alive) {
  const base = mix(c.thorax, '#3a1a08', 0.12);
  ellipse(ctx, -2.4, 0, 0.9, 0.5, mix(base, '#1a0a03', 0.35));
  const knot = (cx) => { cx.beginPath(); cx.ellipse(-2.4, 0, 0.75, 1.15, 0, 0, Math.PI * 2); };
  shade(ctx, knot, -2.4, 0, 0.75, 1.15, base, L, { alive, gloss: 0.8, glow: 0.2 });
}

// The mesosoma: three plates, each with its own dome of light, and the
// sutures between them.
function mesosoma(ctx, c, L, alive, rnd) {
  shade(ctx, mesosomaPath, 2.0, 0, 3.8, 2.3, c.thorax, L, { alive, gloss: 0.5, glow: 0.24 });

  ctx.save();
  mesosomaPath(ctx);
  ctx.clip();
  for (const { x, rx, ry } of MESOSOMA_PLATES) {
    const g = ctx.createRadialGradient(x + L.x * rx * 0.4, L.y * ry * 0.4, 0, x + L.x * rx * 0.4, L.y * ry * 0.4, rx * 0.9);
    g.addColorStop(0, `rgba(255,246,228,${alive ? 0.22 : 0.08})`);
    g.addColorStop(1, 'rgba(255,246,228,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rx * 2, -ry * 2, rx * 4, ry * 4);
  }
  for (const [x, ry] of MESOSOMA_SUTURES) {
    arc(ctx, x + 0.45, 0, 0.55, ry, Math.PI * 0.62, Math.PI * 1.38, 'rgba(34,14,4,0.3)', 0.16);
  }
  pits(ctx, rnd, 2.0, 3.6, 2.0, 24);
  ctx.restore();

  if (alive) setae(ctx, rnd, 8, 2.4, 0, 2.8, 1.6, 0.6, 0.2);

  // The neck: the dark gap where the head fits into the thorax.
  ellipse(ctx, 6.0, 0, 0.9, 1.2, 'rgba(22,10,3,0.6)');
}
