// What Fagi carries between her mandibles.

import { POINT_TYPES } from '../config.js';
import { mix } from '../sprite-kit.js';
import { ellipse, point } from './stroke.js';

// What she is carrying: gripped by the mandibles, with its volume and its
// shadow over the head.
export function drawCarried(ctx, type, L) {
  const spec = POINT_TYPES[type];
  const r = spec.radius + 1;
  const x = 14.6;

  ellipse(ctx, x - L.x * r * 0.5, -L.y * r * 0.5, r * 0.95, r * 0.8, 'rgba(14,9,5,0.4)');

  const g = ctx.createRadialGradient(x + L.x * r * 0.45, L.y * r * 0.45, r * 0.1, x, 0, r * 1.2);
  g.addColorStop(0, mix(spec.color, '#ffffff', 0.45));
  g.addColorStop(0.5, spec.color);
  g.addColorStop(1, mix(spec.color, '#100a06', 0.55));
  point(ctx, x, 0, r, g);
}
