// Photographic rocks. The object's seed fixes geology and finish for its whole
// life; the photo is stamped rotated, stretched and tinted from it.

import { APPEARANCES, appearanceOf } from '../object-appearance.js';
import { LX, LY } from './common.js';
import { bakedPhoto, stamp } from '../sprite-kit.js';

// Eight truly different geologies and silhouettes. The object's seed picks a
// family and then alters proportion, orientation, size and tone, so even two
// rocks of the same material are not exact copies.
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

// Eight geologies × three weathering states = 24 visual types. Not a
// per-frame choice: the seed fixes the type for the object's whole life.
const FINISHES = [
  { name: 'natural', hue: 0, sat: 1, light: 1, contrast: 1.02, x: 1, y: 1 },
  { name: 'wet', hue: -5, sat: 1.08, light: 0.82, contrast: 1.14, x: 0.93, y: 1.08 },
  { name: 'dry', hue: 7, sat: 0.78, light: 1.08, contrast: 0.94, x: 1.1, y: 0.88 },
];
const ROCK_TYPES = ROCK_SOURCES.flatMap((_, base) =>
  FINISHES.map((finish) => ({ base, ...finish }))
);

// The type the seed gets and its photo. Returns null while the photo has not
// loaded: the procedural rock is painted then.
export function realisticRockOf(seedOf, object = {}) {
  const typeIndex = ((seedOf ^ (seedOf >>> 16)) >>> 0) % ROCK_TYPES.length;
  const material = APPEARANCES.rock.findIndex(([id]) => id === appearanceOf(object));
  const type = ROCK_TYPES[material < 0 ? typeIndex : material * FINISHES.length + typeIndex % FINISHES.length];
  const rock = realisticRocks[type.base];
  if (rock.complete && rock.naturalWidth > 0) return { rock, type };
  return null;
}

export function drawRealisticRock(ctx, o, r, rock, type, seedOf) {
  const turn = (((seedOf >>> 5) & 255) / 255 - 0.5) * 1.05;
  const width = r * (1.86 + ((seedOf >>> 13) & 63) / 280) * type.x;
  const ratio = rock.naturalHeight / rock.naturalWidth;
  const tall = width * ratio * (0.78 + ((seedOf >>> 19) & 63) / 175) * type.y;
  const tone = type.hue + (((seedOf >>> 9) & 15) - 7);
  const baseSaturation = [0.82, 0.72, 0.76, 0.9, 0.66, 0.72, 0.48, 0.86][type.base];
  const baseShine = [0.88, 0.9, 0.82, 0.86, 0.94, 0.78, 1.02, 0.8][type.base];
  const saturation = baseSaturation * type.sat;
  const shine = (baseShine + ((seedOf >>> 22) & 15) / 100) * type.light;

  // Everything above is fixed by the seed: one bake per rock and size.
  const img = bakedPhoto(baked, `${seedOf}|${type.base}|${type.name}|${r.toFixed(1)}`, {
    image: rock, width, tall, turn,
    filter: `hue-rotate(${tone}deg) saturate(${saturation}) brightness(${shine}) contrast(${type.contrast})`,
    shadow: 'rgba(5,7,6,0.72)', blur: Math.max(2, r * 0.13), offX: -LX * r * 0.16, offY: -LY * r * 0.16,
  });
  stamp(ctx, img, o.x, o.y);
}
const baked = new Map();
