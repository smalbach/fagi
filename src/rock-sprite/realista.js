// Rocas fotográficas. La semilla del objeto fija geología y acabado para toda
// su vida; la foto se estampa girada, estirada y teñida a partir de ella.

import { LX, LY } from './comun.js';

// Cuatro geologías y siluetas realmente distintas. La semilla del objeto elige
// una familia y luego altera proporción, orientación, tamaño y tono, así que
// incluso dos rocas del mismo material no son copias exactas.
const FUENTES_ROCA = [
  '/assets/rock-boulder.webp',
  '/assets/rock-granite.webp',
  '/assets/rock-slate.webp',
  '/assets/rock-sandstone.webp',
  '/assets/rock-limestone.webp',
  '/assets/rock-volcanic.webp',
  '/assets/rock-quartzite.webp',
  '/assets/rock-ironstone.webp',
];
const rocasRealistas = FUENTES_ROCA.map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

// Ocho geologías × tres estados de intemperie = 24 tipos visuales. No son una
// elección por fotograma: la semilla fija el tipo para toda la vida del objeto.
const ACABADOS = [
  { nombre: 'natural', hue: 0, sat: 1, luz: 1, contraste: 1.02, x: 1, y: 1 },
  { nombre: 'humeda', hue: -5, sat: 1.08, luz: 0.82, contraste: 1.14, x: 0.93, y: 1.08 },
  { nombre: 'seca', hue: 7, sat: 0.78, luz: 1.08, contraste: 0.94, x: 1.1, y: 0.88 },
];
const TIPOS_ROCA = FUENTES_ROCA.flatMap((_, base) =>
  ACABADOS.map((acabado) => ({ base, ...acabado }))
);

// El tipo que le toca a la semilla y su foto. Devuelve null mientras la foto no
// haya cargado: entonces se pinta la roca procedural.
export function rocaRealistaDe(semilla) {
  const indiceTipo = ((semilla ^ (semilla >>> 16)) >>> 0) % TIPOS_ROCA.length;
  const tipo = TIPOS_ROCA[indiceTipo];
  const roca = rocasRealistas[tipo.base];
  if (roca.complete && roca.naturalWidth > 0) return { roca, tipo };
  return null;
}

export function drawRockRealista(ctx, o, r, roca, tipo, semilla) {
  const giro = (((semilla >>> 5) & 255) / 255 - 0.5) * 1.05;
  const ancho = r * (1.86 + ((semilla >>> 13) & 63) / 280) * tipo.x;
  const proporcion = roca.naturalHeight / roca.naturalWidth;
  const alto = ancho * proporcion * (0.78 + ((semilla >>> 19) & 63) / 175) * tipo.y;
  const tono = tipo.hue + (((semilla >>> 9) & 15) - 7);
  const saturacionBase = [0.82, 0.72, 0.76, 0.9, 0.66, 0.72, 0.48, 0.86][tipo.base];
  const brilloBase = [0.88, 0.9, 0.82, 0.86, 0.94, 0.78, 1.02, 0.8][tipo.base];
  const saturacion = saturacionBase * tipo.sat;
  const brillo = (brilloBase + ((semilla >>> 22) & 15) / 100) * tipo.luz;

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(giro);
  ctx.shadowColor = 'rgba(5,7,6,0.72)';
  ctx.shadowBlur = Math.max(2, r * 0.13);
  ctx.shadowOffsetX = -LX * r * 0.16;
  ctx.shadowOffsetY = -LY * r * 0.16;
  ctx.filter = `hue-rotate(${tono}deg) saturate(${saturacion}) brightness(${brillo}) contrast(${tipo.contraste})`;
  ctx.drawImage(roca, -ancho / 2, -alto / 2, ancho, alto);
  ctx.restore();
}
