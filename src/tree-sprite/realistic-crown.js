// High-resolution photographic crown. The procedural version stays as a
// fallback while loading and also keeps the tree working without network.

import { LX, LY } from './common.js';
import { canvasOf, seededRng } from '../sprite-kit.js';
import { blossom } from './forms.js';

const realisticCrown = new Image();
let realisticCrownReady = false;
realisticCrown.onload = () => { realisticCrownReady = true; };
realisticCrown.src = '/assets/tree-canopy.webp';

export function realisticCrownLoaded() {
  return realisticCrownReady;
}

// The photo, tinted toward the fruit's color and in bloom with it: painted
// once per color, on a canvas no bigger than it needs to be.
const tinted = new Map();
const TINT_SIZE = 512;

function tintedCrown(color) {
  const done = tinted.get(color);
  if (done) return done;
  if (tinted.size > 24) tinted.clear();
  const k = Math.min(1, TINT_SIZE / Math.max(realisticCrown.naturalWidth, realisticCrown.naturalHeight));
  const w = Math.max(1, Math.round(realisticCrown.naturalWidth * k));
  const h = Math.max(1, Math.round(realisticCrown.naturalHeight * k));
  const c = canvasOf(w, h);
  const ctx = c.getContext('2d');
  ctx.drawImage(realisticCrown, 0, 0, w, h);
  // The leaves take the fruit's hue but keep the photo's light and shade.
  ctx.globalCompositeOperation = 'color';
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  // The blend also painted the transparent corners: the photo's outline cuts them away.
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(realisticCrown, 0, 0, w, h);
  // Flowers only where there is leaf.
  ctx.globalCompositeOperation = 'source-atop';
  const rnd = seededRng(0xb10057);
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * 0.4;
    blossom(ctx, w / 2 + Math.cos(a) * d * w, h / 2 + Math.sin(a) * d * h, w * (0.009 + rnd() * 0.006), color, rnd() * 6);
  }
  ctx.globalCompositeOperation = 'source-over';
  tinted.set(color, c);
  return c;
}

export function stampRealisticCrown(ctx, o, r, v, dry, seedOf, color = null) {
  // Rotation and size come from the seed: even sharing a photo, no two
  // identical silhouettes appear. The crown ages by losing saturation and
  // gaining sepia, while transparency lets more branches show through.
  const turn = ((seedOf >>> 4) % 6283) / 1000;
  const variation = 0.92 + ((seedOf >>> 13) & 255) / 255 * 0.16;
  // A mature crown clearly exceeds the trunk's diameter and its collision
  // zone. The previous size got lost in the map's overview.
  const width = r * 2.85 * variation;
  const tall = width * (realisticCrown.naturalHeight / realisticCrown.naturalWidth);

  ctx.save();
  ctx.translate(o.x + v.x, o.y + v.y - r * 0.12);
  ctx.rotate(turn);
  ctx.globalAlpha = 1 - dry * 0.28;
  ctx.shadowColor = 'rgba(4,8,5,0.72)';
  ctx.shadowBlur = r * 0.18;
  ctx.shadowOffsetX = -LX * r * 0.08;
  ctx.shadowOffsetY = -LY * r * 0.08;
  ctx.filter = `saturate(${1.12 - dry * 0.66}) sepia(${dry * 0.48}) brightness(${1.06 - dry * 0.12})`;
  ctx.drawImage(color ? tintedCrown(color) : realisticCrown, -width / 2, -tall / 2, width, tall);
  ctx.restore();
}
