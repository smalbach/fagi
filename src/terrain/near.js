// What the ground gains when zooming in. The ground is baked ONCE at world size,
// so up close it gets stretched; these two layers give back what the
// stretching eats up.

import { seededRng, seedFor, noise } from '../sprite-kit.js';
import { pebble, bush, leaf, litter } from './details.js';
import { mood } from './palette.js';

// Zoom grain. The ground is baked ONCE at world size, so when zooming in it
// stretches and loses its texture: repainting it for every zoom step would
// cost a canvas of several million pixels. This layer is in SCREEN pixels,
// repeats like a tile and gives back the grain the stretching eats up,
// without repainting anything. The closer you get, the more it shows.
let tile = null;
let pattern = null;

export function drawZoomGrain(ctx, zoom) {
  if (zoom <= 1.12) return;
  tile ??= noise(160, 160, seededRng(0x51a3d7), 3, 3);
  pattern ??= ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = Math.min(0.22, (zoom - 1) * 0.11);
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Close-up detail. The ground is baked ONCE at world size, so when zooming in it
// stretches: the screen grain gives back the texture, but it doesn't give back
// THINGS. Up close, ground without a pebble, a blade of grass or a scrap of leaf
// at Fagi's scale reads as a blurry photo.
//
// This layer sows those things in WORLD coordinates, by cell and with each
// cell's own seed: the same pebble always shows up in the same spot, so the
// ground doesn't boil when the camera moves. Only what's visible is sown, and
// the amount rises with the magnification: from afar there's nothing to pay.
const CELL = 96;              // cell side, in world pixels

export function drawNearDetail(ctx, world, cam, canvas) {
  const force = Math.min(1, (cam.zoom - 1.25) / 1.4);
  if (force <= 0) return;

  const vw = canvas.width / cam.zoom;
  const vh = canvas.height / cam.zoom;
  const i0 = Math.floor((cam.x - vw / 2) / CELL);
  const i1 = Math.ceil((cam.x + vw / 2) / CELL);
  const j0 = Math.floor((cam.y - vh / 2) / CELL);
  const j1 = Math.ceil((cam.y + vh / 2) / CELL);
  const seedOf = seedFor(world);

  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const ox = i * CELL;
      const oy = j * CELL;
      if (ox > world.width || oy > world.height || ox + CELL < 0 || oy + CELL < 0) continue;
      const rnd = seededRng((seedOf ^ Math.imul(i, 374761393) ^ Math.imul(j, 668265263)) >>> 0);
      cellOf(ctx, ox, oy, rnd, force);
    }
  }
  ctx.globalAlpha = 1;
}

// What's in a hand's width of earth: grit, a pebble or two, a blade of grass and
// a scrap of leaf. In this order, which is the order they have on the ground.
function cellOf(ctx, ox, oy, rnd, force) {
  // `howMany` at full strength, each at a random point in the cell.
  const scatter = (howMany, put) => {
    for (let k = 0, n = Math.round(howMany * force); k < n; k++) {
      put(ox + rnd() * CELL, oy + rnd() * CELL);
    }
  };

  ctx.globalAlpha = force;
  scatter(34, (x, y) => {
    ctx.fillStyle = rnd() < 0.45
      ? `rgba(228,216,188,${0.05 + rnd() * 0.1})`
      : `rgba(12,13,16,${0.07 + rnd() * 0.14})`;
    ctx.fillRect(x, y, 0.8 + rnd() * 0.7, 0.8);
  });
  // The same climate as the baked ground (palette.js mood): fewer blades
  // and leaves where it's dry or cold, more where it rains.
  const { arid, lush, cold } = mood;
  scatter(7 * (1 + arid * 0.8 + cold * 0.5), (x, y) => pebble(ctx, x, y, 0.8 + rnd() * 1.8, rnd));
  scatter(5 * (1 - arid * 0.7) * (1 + lush * 0.8) * (1 - cold * 0.4), (x, y) => bush(ctx, x, y, 2 + rnd() * 3.5, rnd));
  scatter(4 * (1 - arid * 0.6) * (1 + lush * 0.8) * (1 - cold * 0.5), (x, y) => leaf(ctx, x, y, 2.5 + rnd() * 3.5, rnd));
  scatter(3 * (1 - cold * 0.5), (x, y) => litter(ctx, x, y, 2 + rnd() * 4, rnd));
  ctx.globalAlpha = 1;
}
