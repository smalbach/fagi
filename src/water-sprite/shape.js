// The lake's light, colors and shape: what the still canvas shares with the
// live parts drawn on top.

import { LAKE } from '../config.js';
import { seededRng } from '../sprite-kit.js';

export const LIGHT = -Math.PI * 0.72;   // the same light as the ground, the rock and the tree
export const LX = Math.cos(LIGHT);
export const LY = Math.sin(LIGHT);

export const DEEP_KEY = '#16384a';       // the center, where the bottom can't be seen
export const MIDDLE = '#1f5f79';       // water with a distant bottom
export const SHALLOWS = '#5c8f86';        // the shallows by the shore, greenish
export const SAND = '#7d7154';
export const MUD = '#2e281e';
export const REED = ['#5a6e3f', '#6b7d47', '#475a37'];

// A lake's shoreline: a circle with three slow waves added to it. The same ones
// for the still canvas and for the live parts drawn on top, so the profile
// comes from the seed and not from each pass's randomness.
export function profile(seedOf, blend, amplitude) {
  const rnd = seededRng((seedOf ^ blend) >>> 0);
  const ripples = [];
  for (let i = 0; i < 3; i++) {
    ripples.push({
      k: 2 + i * 2 + ((rnd() * 2) | 0),
      amp: (amplitude / (i + 1)) * (0.7 + rnd() * 0.6),
      phase: rnd() * Math.PI * 2,
    });
  }
  return (a) => {
    let v = 1;
    for (const o of ripples) v += Math.sin(a * o.k + o.phase) * o.amp;
    return v;
  };
}

// The water's shoreline profile. The canvas, the reflections and the reeds have
// to hug the SAME edge, so it always comes from here.
export const shoreProfile = (seedOf) => profile(seedOf, 0x51ed270b, LAKE.waveEdge);

// Traces the outline on whatever context it's given. 72 segments: at this size
// they can't be told apart from a curve.
export function outline(ctx, cx, cy, r, shape, steps = 72) {
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const rr = r * shape(a);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
