// Fagi's body: gaster, leaf, petiole, mesosoma and head, in that order, which
// is back to front and bottom to top.

import { mix, seededRng } from '../sprite-kit.js';
import { shell, edgeLine, outline } from './light.js';
import { gasterPath, mesosomaPath } from './silhouettes.js';
import { ellipse, point, line, arc } from './stroke.js';
import { drawLeaf } from './leaf.js';
import { head } from './head.js';

// Fixed randomness: the speckles and hairs must come out the SAME every frame,
// or the ant would shimmer.
const GRAIN = 0x5f3a1c7b;

export function drawBody(ctx, c, leaf, L, alive) {
  const rnd = seededRng(GRAIN);

  gaster(ctx, c, L, alive, rnd);
  drawLeaf(ctx, leaf, L);
  petiole(ctx, c, L);
  mesosoma(ctx, c, L);
  head(ctx, c, L, alive, rnd);
}

// The gaster: the big piece, and the one that catches the most light. It has
// the tergites —the abdomen's rings— because a smooth egg reads as a drop.
function gaster(ctx, c, L, alive, rnd) {
  ctx.save();
  gasterPath(ctx);
  ctx.clip();

  ctx.fillStyle = shell(ctx, -9.6, 0, 7.4, c.gaster, L, 0.34, 0.66);
  ctx.fillRect(-18, -8, 18, 16);

  tergites(ctx);
  gasterGrain(ctx, rnd);
  if (alive) gasterShine(ctx, L);
  ctx.restore();

  outline(ctx, gasterPath, 0.75);
  edgeLine(ctx, gasterPath, -9.8, 0, 7.4, mix(c.gaster, '#ffeccb', 0.6), 0.32, 0.9, L);

  if (alive) gasterHairs(ctx);
}

// Tergites: the abdomen's rings. Each one overlaps the one behind, so the
// seam bows toward the tail and has its light lip in front. They are faint
// on purpose: strongly marked they read as the stripes of a ball.
function tergites(ctx) {
  ctx.lineCap = 'butt';
  for (const [x, ry] of [[-7.6, 5.7], [-10.8, 5.2], [-13.6, 3.9]]) {
    arc(ctx, x + 2.4, 0, 2.4, ry, Math.PI * 0.62, Math.PI * 1.38, 'rgba(40,20,8,0.24)', 0.9);
    arc(ctx, x + 3.1, 0, 2.4, ry, Math.PI * 0.62, Math.PI * 1.38, 'rgba(255,226,176,0.12)', 0.6);
  }
  ctx.lineCap = 'round';
}

// Chitin grain: fine pitting, no two dots alike.
function gasterGrain(ctx, rnd) {
  for (let i = 0; i < 46; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * 6.4;
    const color = rnd() < 0.5
      ? `rgba(58,28,10,${0.06 + rnd() * 0.12})`
      : `rgba(255,232,190,${0.04 + rnd() * 0.08})`;
    point(ctx, -9.8 + Math.cos(a) * d, Math.sin(a) * d * 0.85, 0.32 + rnd() * 0.4, color);
  }
}

// The specular shine: a small, elongated, very light spot where the light
// comes in. It is the only thing that says "this is hard and polished".
function gasterShine(ctx, L) {
  ctx.save();
  ctx.translate(-9.8 + L.x * 3.4, L.y * 3.0);
  ctx.rotate(Math.atan2(L.y, L.x) + Math.PI / 2);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 3.2);
  g.addColorStop(0, `rgba(255,240,214,0.34)`);
  g.addColorStop(1, 'rgba(255,240,214,0)');
  ellipse(ctx, 0, 0, 3.2, 1.5, g);
  ctx.restore();
}

// Gaster hairs: short, stiff and only along the edge. They show against the
// ground and are the difference between a critter and a piece of plastic.
function gasterHairs(ctx) {
  ctx.strokeStyle = 'rgba(70,38,16,0.5)';
  ctx.lineWidth = 0.55;
  for (let i = 0; i < 11; i++) {
    const a = Math.PI * (0.35 + (i / 10) * 1.3) * (i % 2 ? 1 : -1);
    const x = -9.8 + Math.cos(a) * 6.6;
    const y = Math.sin(a) * 5.6;
    line(ctx, x, y, x + Math.cos(a) * 1.9, y + Math.sin(a) * 1.9);
  }
  ctx.lineWidth = 1;
}

// The petiole: the two little knots of the waist. It is the trait only ants
// have, and from above it is what separates the gaster from the thorax
// instead of two ovals touching.
function petiole(ctx, c, L) {
  // The shadow the gaster and thorax cast over the gap.
  ellipse(ctx, -2.5, 0, 2.4, 2.6, 'rgba(24,12,5,0.45)');

  for (const [x, r] of [[-3.0, 1.55], [-1.5, 1.35]]) {
    ellipse(ctx, x, 0, r, r * 1.05, shell(ctx, x, 0, r, mix(c.thorax, '#2a1708', 0.18), L, 0.4, 0.55));
  }
}

// The mesosoma, with its hump and its neck. The groove across it is the
// suture separating the pronotum from the rest.
function mesosoma(ctx, c, L) {
  ctx.save();
  mesosomaPath(ctx);
  ctx.clip();

  ctx.fillStyle = shell(ctx, 2.0, 0, 4.4, c.thorax, L, 0.4, 0.62);
  ctx.fillRect(-3, -6, 11, 12);

  arc(ctx, -0.6, 0, 3.4, 4.4, -1.1, 1.1, 'rgba(46,24,10,0.4)', 0.9);
  arc(ctx, -1.2, 0, 3.4, 4.4, -1.05, 1.05, 'rgba(255,228,182,0.2)', 0.6);
  ctx.lineWidth = 1;
  ctx.restore();

  outline(ctx, mesosomaPath, 0.6);
  edgeLine(ctx, mesosomaPath, 2.0, 0, 4.4, mix(c.thorax, '#ffeccb', 0.7), 0.45, 1, L);

  // The neck: the dark gap where the head fits into the thorax.
  ellipse(ctx, 5.7, 0, 1.3, 2.2, 'rgba(28,14,6,0.5)');
}
