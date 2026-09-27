// Copa fotográfica de alta resolución. La versión procedural queda como
// respaldo durante la carga y también conserva el árbol funcional sin red.

import { LX, LY } from './common.js';

const realisticCrown = new Image();
let realisticCrownReady = false;
realisticCrown.onload = () => { realisticCrownReady = true; };
realisticCrown.src = '/assets/tree-canopy.webp';

export function realisticCrownLoaded() {
  return realisticCrownReady;
}

export function stampRealisticCrown(ctx, o, r, v, dry, seedOf) {
  // Rotación y tamaño nacen de la semilla: incluso compartiendo fotografía no
  // aparecen dos siluetas idénticas. La copa envejece perdiendo saturación y
  // ganando sepia, mientras la transparencia deja ver más ramaje.
  const giro = ((seedOf >>> 4) % 6283) / 1000;
  const variation = 0.92 + ((seedOf >>> 13) & 255) / 255 * 0.16;
  // Una copa adulta excede claramente el diámetro del tronco y su zona de
  // colisión. El tamaño anterior se perdía en la vista general del mapa.
  const width = r * 2.85 * variation;
  const tall = width * (realisticCrown.naturalHeight / realisticCrown.naturalWidth);

  ctx.save();
  ctx.translate(o.x + v.x, o.y + v.y - r * 0.12);
  ctx.rotate(giro);
  ctx.globalAlpha = 1 - dry * 0.28;
  ctx.shadowColor = 'rgba(4,8,5,0.72)';
  ctx.shadowBlur = r * 0.18;
  ctx.shadowOffsetX = -LX * r * 0.08;
  ctx.shadowOffsetY = -LY * r * 0.08;
  ctx.filter = `saturate(${1.12 - dry * 0.66}) sepia(${dry * 0.48}) brightness(${1.06 - dry * 0.12})`;
  ctx.drawImage(realisticCrown, -width / 2, -tall / 2, width, tall);
  ctx.restore();
}
