// The terrain before the details: the noise fields that decide everything, the
// color and light that come out of them, the grain and the sunny clearings.

import { TERRAIN, WORLD } from '../config.js';
import { canvasOf, noise } from '../sprite-kit.js';
import { LIGHT, LX, LY, SOIL, DRY_TONE, MOSS, GRAVEL } from './palette.js';

// Multi-octave value noise, sampleable at any point in the world.
// The sprite-kit one returns a canvas; here the number is needed, because the
// same field decides a pixel's color and where a tuft sprouts.
export function field(w, h, rnd, cellOf, octaves) {
  const layers = [];
  for (let o = 0; o < octaves; o++) {
    const step = Math.max(3, cellOf / 2 ** o);
    const gw = Math.ceil(w / step) + 2;
    const gh = Math.ceil(h / step) + 2;
    const g = new Float32Array(gw * gh);
    for (let i = 0; i < g.length; i++) g[i] = rnd();
    layers.push({ step, gw, gh, g });
  }

  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    let v = 0;
    let weight = 0;
    for (let o = 0; o < layers.length; o++) {
      const { step, gw, gh, g } = layers[o];
      const fx = Math.min(Math.max(x, 0) / step, gw - 2);
      const fy = Math.min(Math.max(y, 0) / step, gh - 2);
      const ix = fx | 0;
      const iy = fy | 0;
      const tx = smooth(fx - ix);
      const ty = smooth(fy - iy);
      const up = g[iy * gw + ix] + (g[iy * gw + ix + 1] - g[iy * gw + ix]) * tx;
      const down = g[(iy + 1) * gw + ix] + (g[(iy + 1) * gw + ix + 1] - g[(iy + 1) * gw + ix]) * tx;
      const amp = 1 / (o + 1);
      v += (up + (down - up) * ty) * amp;
      weight += amp;
    }
    return v / weight;
  };
}

function lerp(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

// Color of a patch of ground: base earth, drier the higher it is, greener the
// damper it is, and gravel where stone peeks through.
function tone(tall, moisture, stone) {
  let c = lerp(SOIL, DRY_TONE, Math.max(0, (tall - 0.45) / 0.55));
  c = lerp(c, MOSS, Math.max(0, (moisture - TERRAIN.mossFrom) / (1 - TERRAIN.mossFrom)));
  return lerp(c, GRAVEL, Math.max(0, (stone - TERRAIN.gravelFrom) / (1 - TERRAIN.gravelFrom)));
}

// Base: color and light in one go, on a coarse grid that is then stretched. The
// relief isn't drawn, it's lit: the slope of the height field decides whether
// a hillside faces the light or stays in shadow. That's what turns a blotch
// of noise into hills.
export function paintBase(ctx, w, h, tall, moisture, stone) {
  const step = TERRAIN.lightCell;
  const gw = Math.ceil(w / step);
  const gh = Math.ceil(h / step);
  const c = canvasOf(gw, gh);
  const bctx = c.getContext('2d');
  const img = bctx.createImageData(gw, gh);

  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const x = i * step;
      const y = j * step;
      const a = tall(x, y);
      const col = tone(a, moisture(x, y), stone(x, y));

      // Slope by finite differences: which way the terrain falls here.
      const dx = (tall(x + step, y) - tall(x - step, y)) * TERRAIN.relief;
      const dy = (tall(x, y + step) - tall(x, y - step)) * TERRAIN.relief;
      const light = -(dx * LX + dy * LY);
      // Low ground gets less sky: it dims a little even when flat.
      const factor = 1 + light + (a - 0.5) * TERRAIN.deep;

      const k = (j * gw + i) * 4;
      img.data[k] = Math.max(0, Math.min(255, col[0] * factor));
      img.data[k + 1] = Math.max(0, Math.min(255, col[1] * factor));
      img.data[k + 2] = Math.max(0, Math.min(255, col[2] * factor));
      img.data[k + 3] = 255;
    }
  }
  bctx.putImageData(img, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(c, 0, 0, w, h);
}

// Grain: two stretched noise layers. The fine one is the clods; the coarse one,
// the big patches of differently colored earth. They're generated smaller and
// stretched, which is cheaper and leaves no seams on top of that.
export function paintGrain(ctx, w, h, rnd) {
  // The clods go at real size: stretched they blur and the ground loses its
  // texture. It's the most expensive part of the whole ground and is paid only once.
  const thin = noise(w, h, rnd, 3, 3);
  const coarse = noise((w / 5) | 0, (h / 5) | 0, rnd, 7, 2);

  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = TERRAIN.grain;
  ctx.drawImage(thin, 0, 0, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = TERRAIN.patches;
  ctx.drawImage(coarse, 0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

// Very open dappled light. The patches have soft edges and a shared direction;
// that way they seem to come from gaps in a distant canopy, not painted circles.
export function paintClearings(ctx, w, h, rnd, moisture) {
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  for (let i = 0; i < TERRAIN.clearings * Math.max(1, (w * h) / (WORLD.baseWidth * WORLD.baseHeight)); i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 24 + rnd() * 90;
    const force = 0.025 + Math.max(0, 0.62 - moisture(x, y)) * 0.12;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(LIGHT + (rnd() - 0.5) * 0.35);
    ctx.scale(1, 0.38 + rnd() * 0.22);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(255,235,185,${force})`);
    g.addColorStop(0.55, `rgba(240,220,170,${force * 0.55})`);
    g.addColorStop(1, 'rgba(240,220,170,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
