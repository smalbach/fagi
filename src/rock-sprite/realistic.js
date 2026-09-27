// Rocas fotográficas. La semilla del objeto fija geología y acabado para toda
// su vida; la foto se estampa girada, estirada y teñida a partir de ella.

import { LX, LY } from './common.js';

// Cuatro geologías y siluetas realmente distintas. La semilla del objeto elige
// una familia y luego altera proporción, orientación, tamaño y tono, así que
// incluso dos rocas del mismo material no son copias exactas.
const ROCK_SOURCES = [
  '/assets/rock-boulder.webp',
  '/assets/rock-granite.webp',
  '/assets/rock-slate.webp',
  '/assets/rock-sandstone.webp',
  '/assets/rock-limestone.webp',
  '/assets/rock-volcanic.webp',
  '/assets/rock-quartzite.webp',
  '/assets/rock-ironstone.webp',
];
const realisticRocks = ROCK_SOURCES.map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

// Ocho geologías × tres estados de intemperie = 24 tipos visuales. No son una
// elección por fotograma: la semilla fija el tipo para toda la vida del objeto.
const FINISHES = [
  { name: 'natural', hue: 0, sat: 1, light: 1, contrast: 1.02, x: 1, y: 1 },
  { name: 'humeda', hue: -5, sat: 1.08, light: 0.82, contrast: 1.14, x: 0.93, y: 1.08 },
  { name: 'seca', hue: 7, sat: 0.78, light: 1.08, contrast: 0.94, x: 1.1, y: 0.88 },
];
const ROCK_TYPES = ROCK_SOURCES.flatMap((_, base) =>
  FINISHES.map((finish) => ({ base, ...finish }))
);

// El tipo que le toca a la semilla y su foto. Devuelve null mientras la foto no
// haya cargado: entonces se pinta la roca procedural.
export function realisticRockOf(seedOf) {
  const typeIndex = ((seedOf ^ (seedOf >>> 16)) >>> 0) % ROCK_TYPES.length;
  const type = ROCK_TYPES[typeIndex];
  const rock = realisticRocks[type.base];
  if (rock.complete && rock.naturalWidth > 0) return { rock, type };
  return null;
}

export function drawRealisticRock(ctx, o, r, rock, type, seedOf) {
  const giro = (((seedOf >>> 5) & 255) / 255 - 0.5) * 1.05;
  const width = r * (1.86 + ((seedOf >>> 13) & 63) / 280) * type.x;
  const ratio = rock.naturalHeight / rock.naturalWidth;
  const tall = width * ratio * (0.78 + ((seedOf >>> 19) & 63) / 175) * type.y;
  const tone = type.hue + (((seedOf >>> 9) & 15) - 7);
  const baseSaturation = [0.82, 0.72, 0.76, 0.9, 0.66, 0.72, 0.48, 0.86][type.base];
  const baseShine = [0.88, 0.9, 0.82, 0.86, 0.94, 0.78, 1.02, 0.8][type.base];
  const saturation = baseSaturation * type.sat;
  const shine = (baseShine + ((seedOf >>> 22) & 15) / 100) * type.light;

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(giro);
  ctx.shadowColor = 'rgba(5,7,6,0.72)';
  ctx.shadowBlur = Math.max(2, r * 0.13);
  ctx.shadowOffsetX = -LX * r * 0.16;
  ctx.shadowOffsetY = -LY * r * 0.16;
  ctx.filter = `hue-rotate(${tone}deg) saturate(${saturation}) brightness(${shine}) contrast(${type.contrast})`;
  ctx.drawImage(rock, -width / 2, -tall / 2, width, tall);
  ctx.restore();
}
