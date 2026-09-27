// High-resolution photographic crown. The procedural version stays as a
// fallback while loading and also keeps the tree working without network.

import { LX, LY } from './common.js';

const realisticCrown = new Image();
let realisticCrownReady = false;
realisticCrown.onload = () => { realisticCrownReady = true; };
realisticCrown.src = '/assets/tree-canopy.webp';

export function realisticCrownLoaded() {
  return realisticCrownReady;
}

export function stampRealisticCrown(ctx, o, r, v, dry, seedOf) {
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
  ctx.drawImage(realisticCrown, -width / 2, -tall / 2, width, tall);
  ctx.restore();
}
