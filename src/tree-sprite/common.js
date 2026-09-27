// What the tree pieces share: the light, the bark and the trunk canvas. The
// trunk and the branch tips are painted on canvases of the same size and with
// the same wood color, so both come from here.

import { canvasOf, mix, seededRng } from '../sprite-kit.js';

export const CROWN_RISE = 0.34;        // how far above the center the crown sits

export const LIGHT = -Math.PI * 0.72;   // the same light as the ground, the rock and the nest
export const LX = Math.cos(LIGHT);
export const LY = Math.sin(LIGHT);

const BARK = '#4e3620';
export const LICHEN = ['#6c7a52', '#87906a', '#5c6b4a'];

// The trunk canvas and its wood color. Used by the trunk and the branch tips
// with the same seed: that way the branches above the leaves are the same wood
// as those below. Also returns the random source, which the trunk keeps
// drawing from afterward.
export function trunkCanvas(seedOf, R) {
  const rnd = seededRng((seedOf ^ 0x2545f491) >>> 0);
  const pad = Math.ceil(R * 0.6) + 6;
  const S = (R + pad) * 2;
  const c = canvasOf(S, S);
  const ctx = c.getContext('2d');
  const base = mix(BARK, rnd() < 0.5 ? '#6a4b2c' : '#3d2a18', rnd() * 0.5);
  return { rnd, S, c, ctx, base };
}
