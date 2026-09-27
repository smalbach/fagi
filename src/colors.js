// Color: blends, and the color each thing gets according to its state.

import { POINT_TYPES, FRUIT, WORLD } from './config.js';
import { ripeness } from './food.js';

// Accepts '#rrggbb' or 'rgb(r,g,b)' and returns the three channels.
export function toRGB(c) {
  if (c.startsWith('#')) return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  return c.match(/\d+/g).slice(0, 3).map(Number);
}

// Blends two hex colors. Used to show something slowly going bad.
export function blend(a, b, t) {
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const m = (x, y) => Math.round(x + (y - x) * t);
  return `rgb(${m(r1, r2)},${m(g1, g2)},${m(b1, b2)})`;
}

// Color of a type by how far gone it is: from its own to the toxic one's. And
// if it is already toxic, it fades toward the background until it disappears.
// Goes by ripeness and not by point so the sprite can ask for the color of a
// specific stage without having the piece at hand.
export function colorByRipeness(type, ripenessOf) {
  const spec = POINT_TYPES[type];
  const warning = Math.max(0, (ripenessOf - FRUIT.warnFrom) / (1 - FRUIT.warnFrom));
  if (warning <= 0) return spec.color;
  const destination = type === FRUIT.rot ? WORLD.bgColor : POINT_TYPES[FRUIT.rot].color;
  return blend(spec.color, destination, warning * 0.85);
}

// The color of a specific point. Used by the point and its scent plume, so
// both tell the same story.
export function colorOf(p) {
  return colorByRipeness(p.type, ripeness(p));
}

