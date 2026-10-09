// The baked ground: a world-sized canvas painted once per world and afterwards
// only stamped. Here is the order it's painted in; each layer lives in
// relief.js and each detail in details.js.

import { WORLD, TERRAIN } from '../config.js';
import { canvasOf, seededRng, seedFor } from '../sprite-kit.js';
import { field, paintBase, paintGrain, paintClearings, mossFromOf } from './relief.js';
import { pebble, bush, litter, leaf, moss, root, crack } from './details.js';
import { tuneTones } from './palette.js';
import { baseClimate, climateKey } from '../climate.js';

// Only one ground is kept: the current world's. Each canvas is screen-sized,
// and on restart the previous one is no use anymore.
let ground = null;             // { key, img }

// A climate change repaints the ground, but not on every step of a slider
// being dragged: the new climate has to hold for a moment first.
const SETTLE_MS = 350;
let wanted = { key: null, since: 0 };

// Photographic microtexture. The terrain is still procedural —height, moisture,
// gravel and the placement of each detail change with the seed—; this image only
// adds the microscopic level of material that synthetic noise can't achieve:
// recognizable clods, fibers, tiny stones and organic debris.
const forestTexture = new Image();
let textureReady = false;
forestTexture.onload = () => { textureReady = true; ground = null; };
forestTexture.src = '/assets/forest-floor.webp';

export function drawTerrain(ctx, world) {
  ctx.drawImage(groundOf(world), 0, 0);
}

function groundOf(world) {
  const w = Math.round(world.width);
  const h = Math.round(world.height);
  const climate = baseClimate();
  const place = `${seedFor(world)}|${w}|${h}`;
  const key = `${place}|${climateKey(climate)}`;
  if (ground?.key === key) return ground.img;
  // Same map, new climate: keep showing the old ground until the change settles.
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (wanted.key !== key) wanted = { key, since: now };
  if (ground?.key.startsWith(`${place}|`) && now - wanted.since < SETTLE_MS) return ground.img;
  ground = { key, img: paintGround(world.seed, w, h, climate) };
  return ground.img;
}

function paintGround(seedOf, w, h, climate) {
  tuneTones(climate);
  const rnd = seededRng(seedOf);
  const c = canvasOf(w, h);
  const ctx = c.getContext('2d');

  const tall = field(w, h, rnd, TERRAIN.heightScale, 5);
  const moisture = field(w, h, rnd, TERRAIN.moistureScale, 3);
  const stone = field(w, h, rnd, TERRAIN.gravelScale, 2);

  paintBase(ctx, w, h, tall, moisture, stone, climate);
  paintMicrotexture(ctx, w, h, seedOf, climate);
  paintGrain(ctx, w, h, rnd);
  paintClearings(ctx, w, h, rnd, moisture, climate);
  paintSpecks(ctx, w, h, rnd, climate);
  seedDetails(ctx, w, h, rnd, { tall, moisture, stone }, climate);
  paintVignette(ctx, w, h);
  paintVeil(ctx, w, h);

  return c;
}

// The photo is used as the ground's visible material and lets the color of the
// biomes underneath show through. It repeats at a small scale: the leaves,
// twigs and stones are the world's microdetail, not Fagi-sized objects.
// The photo is a forest floor: in a desert it fades and goes dusty, in a
// tundra it goes gray. The rainforest keeps all of it, darker.
function paintMicrotexture(ctx, w, h, seedOf, { arid = 0, lush = 0, cold = 0 } = {}) {
  if (!textureReady) return;
  const rnd = seededRng((seedOf ^ 0x6a09e667) >>> 0);
  const pattern = ctx.createPattern(forestTexture, 'repeat');
  if (!pattern) return;
  const sideOf = forestTexture.naturalWidth * TERRAIN.photoScale;
  const dx = -rnd() * sideOf;
  const dy = -rnd() * sideOf;
  pattern.setTransform(new DOMMatrix()
    .translate(dx, dy)
    .scale(TERRAIN.photoScale));

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = TERRAIN.photo * (1 - arid * 0.6) * (1 - cold * 0.3);
  const sepia = Math.max(arid * 0.7, cold * 0.2);
  ctx.filter = `brightness(${(1.1 + arid * 0.15 - lush * 0.12).toFixed(2)}) `
    + `saturate(${(0.86 - arid * 0.3 - cold * 0.45 + lush * 0.12).toFixed(2)}) `
    + `sepia(${sepia.toFixed(2)}) contrast(0.96)`;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// The detail counts are for the base map: a bigger map gets as many per
// square pixel, not the same few spread thinner.
export const areaOf = (w, h) => Math.max(1, (w * h) / (WORLD.baseWidth * WORLD.baseHeight));

// Specks of dirt: the smallest thing, beneath everything else.
function paintSpecks(ctx, w, h, rnd, { arid = 0 } = {}) {
  // Loose sand is what a dry place has most of.
  for (let i = 0; i < TERRAIN.specks * (1 + arid * 1.5) * areaOf(w, h); i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    ctx.fillStyle = rnd() < 0.45
      ? `rgba(226,216,190,${0.04 + rnd() * 0.08})`
      : `rgba(14,15,18,${0.06 + rnd() * 0.14})`;
    ctx.fillRect(x, y, 1 + (rnd() < 0.25 ? 1 : 0), 1);
  }
}

// Sowing: throws random points and lets the terrain decide whether something goes there.
// `wants` returns 0..1 and is compared with a die roll, so the detail doesn't appear
// abruptly at a border: it thins out gradually.
function sow(w, h, n, rnd, wants, put) {
  const count = n * areaOf(w, h);
  for (let i = 0; i < count; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    if (rnd() < wants(x, y)) put(x, y);
  }
}

// The climate (climate.js) decides how much of each thing the ground holds:
// a dry place is pebbles and cracked crust with a few straw tufts; a rainy one,
// grass, moss, roots and a deep layer of leaves; a cold one, short and sparse.
function seedDetails(ctx, w, h, rnd, { tall, moisture, stone }, { arid = 0, lush = 0, cold = 0 } = {}) {
  const green = mossFromOf({ arid, lush });
  const growth = (1 - arid * 0.75) * (1 + lush * 0.8) * (1 - cold * 0.45);
  const fallen = (1 - arid * 0.7) * (1 + lush * 0.9) * (1 - cold * 0.5);
  // Where it hardly rains, the earth dries out and cracks even low down.
  const parched = 0.6 + arid * 0.35;

  // Pebbles show up where stone peeks through; cracks, where it's dry and
  // without green; tufts, where it's moist. Everything in its place.
  sow(w, h, TERRAIN.pebbles * (1 + arid * 0.9 + cold * 0.6), rnd,
    (x, y) => Math.max(0, stone(x, y) - 0.35 + arid * 0.12) * 1.6,
    (x, y) => pebble(ctx, x, y, 1.2 + rnd() * 3.2, rnd));

  sow(w, h, TERRAIN.cracks * (1 + arid * 2.5) * (1 - lush * 0.8), rnd,
    (x, y) => Math.max(0, tall(x, y) - 0.55 + arid * 0.35) * Math.max(0, parched - moisture(x, y)) * 4,
    (x, y) => crack(ctx, x, y, (14 + rnd() * 34) * (1 + arid * 0.6), rnd));

  sow(w, h, TERRAIN.bushes * growth, rnd,
    (x, y) => Math.max(0, moisture(x, y) - green) * 2.2,
    (x, y) => bush(ctx, x, y, (3 + rnd() * 6) * (1 - cold * 0.4) * (1 + lush * 0.3), rnd));

  sow(w, h, TERRAIN.litter * (1 - cold * 0.5) * (1 + lush * 0.4), rnd,
    (x, y) => 0.35 + moisture(x, y) * 0.5,
    (x, y) => litter(ctx, x, y, 3 + rnd() * 7, rnd));

  // Moss goes in low, damp spots; roots poke out where there's green, which is
  // where there's something to put them out; and fallen leaves land everywhere,
  // but pile up where the sun doesn't sweep them away.
  // In a tundra the "moss" is lichen, and it is everywhere low and stony.
  sow(w, h, TERRAIN.moss * (1 - arid * 0.85) * (1 + lush * 1.5 + cold * 1.2), rnd,
    (x, y) => Math.max(0, moisture(x, y) - 0.58 + lush * 0.2 + cold * 0.2) * Math.max(0, 0.6 + cold * 0.2 - tall(x, y)) * 6,
    (x, y) => moss(ctx, x, y, 3 + rnd() * 7, rnd));

  sow(w, h, TERRAIN.roots * growth, rnd,
    (x, y) => Math.max(0, moisture(x, y) - green) * 2,
    (x, y) => root(ctx, x, y, 18 + rnd() * 40, rnd));

  sow(w, h, TERRAIN.leaves * fallen, rnd,
    (x, y) => 0.3 + moisture(x, y) * 0.6,
    (x, y) => leaf(ctx, x, y, 3.5 + rnd() * 5, rnd));
}

// The world's edges fade out: the map ends, it isn't cut off.
function paintVignette(ctx, w, h) {
  const vignette = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.32,
    w / 2, h / 2, Math.max(w, h) * 0.72
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, `rgba(0,0,0,${TERRAIN.vignette})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

// Veil in the background color: it unifies everything and lowers the ground's
// contrast, which must stay BELOW that of Fagi and the points.
function paintVeil(ctx, w, h) {
  ctx.globalAlpha = TERRAIN.veil;
  ctx.fillStyle = WORLD.bgColor;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}
