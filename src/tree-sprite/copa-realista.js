// Copa fotográfica de alta resolución. La versión procedural queda como
// respaldo durante la carga y también conserva el árbol funcional sin red.

import { LX, LY } from './comun.js';

const copaRealista = new Image();
let copaRealistaLista = false;
copaRealista.onload = () => { copaRealistaLista = true; };
copaRealista.src = '/assets/tree-canopy.webp';

export function copaRealistaCargada() {
  return copaRealistaLista;
}

export function estamparCopaRealista(ctx, o, r, v, seco, semilla) {
  // Rotación y tamaño nacen de la semilla: incluso compartiendo fotografía no
  // aparecen dos siluetas idénticas. La copa envejece perdiendo saturación y
  // ganando sepia, mientras la transparencia deja ver más ramaje.
  const giro = ((semilla >>> 4) % 6283) / 1000;
  const variacion = 0.92 + ((semilla >>> 13) & 255) / 255 * 0.16;
  // Una copa adulta excede claramente el diámetro del tronco y su zona de
  // colisión. El tamaño anterior se perdía en la vista general del mapa.
  const ancho = r * 2.85 * variacion;
  const alto = ancho * (copaRealista.naturalHeight / copaRealista.naturalWidth);

  ctx.save();
  ctx.translate(o.x + v.x, o.y + v.y - r * 0.12);
  ctx.rotate(giro);
  ctx.globalAlpha = 1 - seco * 0.28;
  ctx.shadowColor = 'rgba(4,8,5,0.72)';
  ctx.shadowBlur = r * 0.18;
  ctx.shadowOffsetX = -LX * r * 0.08;
  ctx.shadowOffsetY = -LY * r * 0.08;
  ctx.filter = `saturate(${1.12 - seco * 0.66}) sepia(${seco * 0.48}) brightness(${1.06 - seco * 0.12})`;
  ctx.drawImage(copaRealista, -ancho / 2, -alto / 2, ancho, alto);
  ctx.restore();
}
