// The ground's light and colors. The light is the same as the rock's and the
// nest's: top left.

export const LIGHT = -Math.PI * 0.72;
export const LX = Math.cos(LIGHT);
export const LY = Math.sin(LIGHT);

// Palette in channels, not hex: the color pass runs per pixel and mixes these
// thousands of times.
export const SOIL = [72, 63, 49];   // bare earth, brown and dull
export const DRY_TONE   = [98, 83, 57];   // high and exposed: dust, lighter
export const MOSS  = [49, 70, 43];   // low and damp: dirty green
export const GRAVEL  = [82, 77, 65];   // gravel: earthy gray, not concrete
export const LEAF   = ['#5d6b46', '#6e7b4c', '#495c3d', '#7a7f4e'];  // tufts
export const BRANCH   = ['#4a3a28', '#5c4831', '#3d3020'];             // litter
export const DRY   = ['#6b5227', '#7d5c2c', '#54401f', '#6a5a30'];  // fallen leaves
export const MOSS_T = ['#3f5c34', '#4a6b3c', '#35502f'];            // moss

// The same colors in other climates (climate.js). The detail painters read the
// arrays above at draw time, so `tuneTones` rewrites them in place.
const BASE = { LEAF: [...LEAF], DRY: [...DRY], MOSS_T: [...MOSS_T] };
const STRAW = ['#9a8a5a', '#a89664', '#8a7a4c', '#b09c68'];      // tufts gone to straw
const LUSH = ['#4c6e3c', '#5a7d44', '#3e6034', '#6a8448'];       // fresh blades
const LICHEN = ['#7d826e', '#8b8f7a', '#6c7262', '#93927e'];     // tundra: lichen and sedge
const BLEACHED = ['#8a7450', '#9b8459', '#76623f', '#a08d62'];   // sun-bleached leaves
const DARK_LEAF = ['#5a4422', '#664c26', '#46351b', '#5d4f2a'];  // soaked, rotting leaves

// How the climate weighs on what gets sown, for whoever paints a detail.
export const mood = { arid: 0, lush: 0, cold: 0 };

const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const toHex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
const blend = (base, toward, t) => base.map((c, i) => mix(c, toward[i % toward.length], t));

export function tuneTones({ arid = 0, lush = 0, cold = 0 } = {}) {
  Object.assign(mood, { arid, lush, cold });
  let leaf = blend(BASE.LEAF, STRAW, arid);
  leaf = blend(leaf, LUSH, lush * (1 - arid));
  leaf = blend(leaf, LICHEN, cold * 0.8);
  let dry = blend(BASE.DRY, BLEACHED, arid * 0.8);
  dry = blend(dry, DARK_LEAF, lush * 0.6);
  const moss = blend(BASE.MOSS_T, LICHEN, Math.max(cold * 0.7, arid * 0.6));
  LEAF.splice(0, LEAF.length, ...leaf);
  DRY.splice(0, DRY.length, ...dry);
  MOSS_T.splice(0, MOSS_T.length, ...moss);
}

// Ground colors (channels) for a climate: the bare earth of a desert is sand,
// the low ground of a rainforest is dark humus, a tundra's moss is gray-green.
const SAND = [148, 122, 84];
const SAND_HIGH = [176, 150, 108];
const HUMUS = [50, 42, 32];
const JUNGLE = [40, 74, 38];
const TUNDRA_SOIL = [92, 88, 78];
const TUNDRA_MOSS = [96, 104, 84];
const lerp3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

export function groundTones({ arid = 0, lush = 0, cold = 0 } = {}) {
  let soil = lerp3(SOIL, SAND, arid * 0.85);
  soil = lerp3(soil, HUMUS, lush * 0.6);
  soil = lerp3(soil, TUNDRA_SOIL, cold * 0.6);
  let high = lerp3(DRY_TONE, SAND_HIGH, arid * 0.9);
  high = lerp3(high, TUNDRA_SOIL, cold * 0.5);
  let moss = lerp3(MOSS, JUNGLE, lush * 0.7);
  moss = lerp3(moss, TUNDRA_MOSS, cold * 0.75);
  moss = lerp3(moss, [118, 112, 74], arid * 0.7);   // what green there is, dusty
  const gravel = lerp3(GRAVEL, [128, 116, 94], arid * 0.6);
  return { soil, high, moss, gravel };
}
