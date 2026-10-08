// What the weather leaves on the land, painted (climate.js decides, this draws).
//
// The baked ground (terrain/) already carries the climate of the place: sand
// in a dry one, humus and moss in a rainy one. This is what changes from hour
// to hour and season to season, so it is painted over it every frame:
//
//   · Frost: below ~2 °C the ground whitens with rime; the sun burns it off.
//   · Snow: it only builds up when something falls and the air is at or below
//     freezing. It settles patchily (in the hollows first), and melts faster
//     the warmer the air gets. Above that, what falls is rain; in between, sleet.
//   · Ice: a long freeze skins ponds and puddles over.
//   · Autumn and winter: grass goes ochre, then dormant and pale, and the
//     broadleaf trees drop their leaves around them (only where winter is
//     cold, climate.js). A hot year's summer parches it straw-yellow instead.
//
// Like the rain's look (rain-sprite/state.js) this is only the picture: it is
// kept here, never in the world, and moves with the world's clock, so a paused
// game doesn't keep snowing and a fast one settles snow faster.
//
// TODO(climate): replays don't carry world.season, so a replay shows neither
// autumn, dormant winter nor shed leaves. Record the season (it is already an
// event, seasons.js) and rebuild it in replay.js.

import { airTemp, leafFallOf } from './climate.js';
import { canvasOf, seededRng, seedFor, cacheSprite } from './sprite-kit.js';
import { field } from './terrain/relief.js';
import { hash } from './rain-sprite/util.js';
import { isTree, radiusOf } from './obstacles.js';
import { TREE, POINT_TYPES } from './config.js';
import { appearanceOf } from './object-appearance.js';
import { formOf } from './tree-sprite/forms.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export const weather = {
  temp: 20,      // °C of the air
  frost: 0,      // 0-1 rime on the ground
  snow: 0,       // 0-1 of the ground covered
  ice: 0,        // 0-1 how frozen the still water is
  fall: 0,       // 0-1 how far into shedding broadleaf trees are
  litter: 0,     // 0-1 fallen leaves on the ground
  parched: 0,    // 0-1 a hot summer's drought
  snowing: 0,    // 0-1 share of what falls that is snow
  at: null,      // world time of the last look
  world: null,
};

// Once per frame, before painting anything that reads it.
export function climateLook(world) {
  const t = world.time ?? 0;
  // A new world, or a jump back in a replay: start from what the air says now.
  const jump = weather.world !== world || weather.at == null || t < weather.at || t - weather.at > 30;
  const dt = jump ? 0 : t - weather.at;
  weather.world = world;
  weather.at = t;

  const T = airTemp(world);
  weather.temp = T;
  const falling = !!world.rain?.on;
  // Snow below 0.5 °C, rain above 2.5 °C, sleet in between.
  weather.snowing = clamp01((2.5 - T) / 2);

  const rimeTarget = clamp01((2 - T) / 6);
  const season = world.season;
  const fall = leafFallOf(season);
  const parched = season?.on && season.hot ? clamp01(-season.cold / 12) : 0;

  if (jump) {
    weather.frost = rimeTarget;
    weather.fall = fall;
    weather.litter = fall;
    weather.parched = parched;
    if (T > 0.5) { weather.snow = 0; weather.ice = 0; }
    return;
  }

  // Rime forms in ~25 s of cold and burns off in ~10 s of warmth.
  weather.frost += (rimeTarget - weather.frost) * Math.min(1, dt / (rimeTarget > weather.frost ? 25 : 10));
  if (falling && T <= 0.5) weather.snow = Math.min(1, weather.snow + (dt / 40) * weather.snowing);
  else if (T > 0.5) weather.snow = Math.max(0, weather.snow - (dt * (T - 0.5)) / 160);
  // Rain on snow melts it too.
  if (falling && T > 2.5) weather.snow = Math.max(0, weather.snow - dt / 60);
  if (T < -1) weather.ice = Math.min(1, weather.ice + (dt * (-1 - T)) / 240);
  else if (T > 0) weather.ice = Math.max(0, weather.ice - (dt * T) / 90);
  weather.fall += (fall - weather.fall) * Math.min(1, dt / 8);
  // Fallen leaves pile up as fast as they drop and rot away slowly.
  weather.litter = weather.fall > weather.litter
    ? weather.fall
    : Math.max(weather.fall, weather.litter - dt / 400);
  weather.parched += (parched - weather.parched) * Math.min(1, dt / 8);
}

export const snowShare = () => weather.snowing;
export const leafFall = () => weather.fall;

// Broadleaf trees and willows shed in winter; conifers and palms keep theirs.
export function deciduous(o) {
  const form = appearanceOf(o, formOf(POINT_TYPES[o.fruit ?? TREE.fruit]));
  return form === 'broadleaf' || form === 'willow';
}

// ── On the ground, under the objects ────────────────────────────────────────

// The season's color on the vegetation, and the leaves under the trees.
export function drawSeasonGround(ctx, world) {
  const { fall, parched, litter } = weather;
  const W = world.width;
  const H = world.height;
  ctx.save();
  if (fall > 0.01) {
    // Turning: warm ochre while the leaves change, peaking halfway.
    const turning = fall * (1 - fall) * 4;
    if (turning > 0.02) {
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = `rgba(200,120,40,${(turning * 0.28).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }
    // Dormant: the green drains out and the grass goes pale tan.
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = `rgba(128,128,128,${(fall * 0.5).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(222,204,170,${(fall * 0.25).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (parched > 0.01) {
    // A scorching summer: straw-yellow, bleached by the sun.
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = `rgba(128,128,128,${(parched * 0.35).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = `rgba(255,214,140,${(parched * 0.4).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
  if (litter > 0.02) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, litter * 1.2);
    // Fresh leaves are bright; by deep winter they've browned and rotted.
    const old = Math.max(0, weather.fall - 0.6) / 0.4;
    if (old > 0.02) ctx.filter = `saturate(${(1 - old * 0.6).toFixed(2)}) brightness(${(1 - old * 0.3).toFixed(2)})`;
    for (const o of world.objects) {
      if (!isTree(o) || !deciduous(o)) continue;
      const r = radiusOf(o);
      const img = leafCarpet(o, r);
      ctx.drawImage(img, o.x - img.width / 2, o.y - img.height / 2);
    }
    ctx.restore();
  }
}

// The leaves a broadleaf tree has dropped: thick under the crown, thinning out
// with distance, blown a little downwind of nothing in particular.
const carpets = new Map();
const AUTUMN = ['#b5651d', '#c8892f', '#9c3d1c', '#d4a23a', '#7a4a1e', '#a8542a', '#8c6a2a'];

function leafCarpet(o, r) {
  const R = Math.round(r);
  return cacheSprite(carpets, `${seedFor(o)}|${R}`, () => {
    const reach = R * 1.9;
    const side = Math.ceil(reach * 2);
    const c = canvasOf(side, side);
    const g = c.getContext('2d');
    const rnd = seededRng((seedFor(o) ^ 0x1eaf) >>> 0);
    const n = Math.round(R * R * 0.45);
    for (let i = 0; i < n; i++) {
      // Denser near the trunk: the square root spreads them, the square gathers them.
      const d = reach * Math.pow(rnd(), 0.75);
      const a = rnd() * Math.PI * 2;
      const x = side / 2 + Math.cos(a) * d;
      const y = side / 2 + Math.sin(a) * d * 0.85;
      const len = 2.2 + rnd() * 3.2;
      g.save();
      g.translate(x, y);
      g.rotate(rnd() * Math.PI);
      g.globalAlpha = (0.55 + rnd() * 0.4) * (1 - (d / reach) * 0.6);
      g.fillStyle = 'rgba(12,10,8,0.35)';
      g.beginPath();
      g.ellipse(0.6, 0.8, len, len * 0.42, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = AUTUMN[(rnd() * AUTUMN.length) | 0];
      g.beginPath();
      g.ellipse(0, 0, len, len * 0.42, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = 'rgba(40,24,10,0.35)';
      g.lineWidth = 0.4;
      g.beginPath();
      g.moveTo(-len * 0.9, 0);
      g.lineTo(len * 0.9, 0);
      g.stroke();
      g.restore();
    }
    return c;
  }, 80);
}

// Rime and snow, over the ground and the mud, under the objects.
export function drawFrostSnow(ctx, world) {
  const { frost, snow } = weather;
  const W = world.width;
  const H = world.height;
  if (frost > 0.02) {
    ctx.save();
    // Rime takes the color out of the vegetation and lays a cold, pale bloom
    // over the ground; up close it is a scatter of tiny ice crystals.
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = `rgba(128,128,128,${(frost * 0.3).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(92,104,122,${(frost * 0.22).toFixed(3)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = Math.min(1, frost * 0.9);
    ctx.fillStyle = rime(ctx);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (snow > 0.01) {
    const levels = snowLevels(world);
    // Crossfade between the two coverages around `snow`.
    const k = snow * (levels.length - 1);
    const i = Math.min(levels.length - 2, Math.floor(k));
    const f = k - i;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    if (i > 0) ctx.drawImage(levels[i], 0, 0, W, H);
    if (f > 0) {
      ctx.globalAlpha = f;
      ctx.drawImage(levels[i + 1], 0, 0, W, H);
    }
    ctx.restore();
  }
}

// Ice crystals: a tile of specks and needles with no structure big enough to
// show that it repeats.
let rimeTile = null;
let rimePattern = null;
function rime(ctx) {
  if (!rimeTile) {
    const N = 384;
    rimeTile = canvasOf(N, N);
    const g = rimeTile.getContext('2d');
    const rnd = seededRng(0xf205);
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * N;
      const y = rnd() * N;
      g.fillStyle = `rgba(236,242,250,${(0.18 + rnd() * 0.5).toFixed(3)})`;
      g.fillRect(x, y, 0.6 + rnd() * 0.9, 0.6 + rnd() * 0.9);
    }
    g.lineCap = 'round';
    for (let i = 0; i < 420; i++) {
      const x = rnd() * N;
      const y = rnd() * N;
      const a = rnd() * Math.PI;
      const l = 1.5 + rnd() * 3;
      g.strokeStyle = `rgba(240,246,252,${(0.15 + rnd() * 0.35).toFixed(3)})`;
      g.lineWidth = 0.5;
      g.beginPath();
      g.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l);
      g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
  }
  rimePattern ??= ctx.createPattern(rimeTile, 'repeat');
  return rimePattern;
}

// Snow covers in order: the hollows first, the exposed bumps last. A few
// coverages are baked once per map (at a quarter of its size: snow is soft),
// from 0 (none) to full.
const COVER = [0, 0.18, 0.4, 0.65, 0.88, 1];
let snowCache = null;   // { key, levels }

function snowLevels(world) {
  // About 640 px across whatever the map's size: sharp enough up close,
  // cheap enough to keep six of.
  const k = Math.max(2, Math.round(world.width / 640));
  const w = Math.max(8, Math.round(world.width / k));
  const h = Math.max(8, Math.round(world.height / k));
  const key = `${seedFor(world)}|${w}|${h}`;
  if (snowCache?.key === key) return snowCache.levels;
  const rnd = seededRng((seedFor(world) ^ 0x5e0f) >>> 0);
  const drift = field(w, h, rnd, 120 / k * 2, 5);
  const grain = field(w, h, rnd, 6, 2);
  const v = new Float32Array(w * h);
  const shade = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = drift(x, y);
      v[y * w + x] = d * 0.85 + grain(x, y) * 0.15;
      // Drifts are lit like the ground: brighter toward the light, top left.
      shade[y * w + x] = (drift(x - 1, y - 1) - drift(x + 1, y + 1)) * 3;
    }
  }
  const sorted = Float32Array.from(v).sort();
  const levels = COVER.map((cover) => {
    const c = canvasOf(w, h);
    if (cover <= 0) return c;
    const g = c.getContext('2d');
    const img = g.createImageData(w, h);
    const th = sorted[Math.min(sorted.length - 1, Math.floor((1 - cover) * sorted.length))];
    const soft = 0.035;
    for (let p = 0; p < v.length; p++) {
      const a = cover >= 1 ? 1 : clamp01((v[p] - th + soft) / (2 * soft));
      const lit = 1 + shade[p];
      const k = p * 4;
      img.data[k] = Math.min(255, 228 * lit);
      img.data[k + 1] = Math.min(255, 234 * lit);
      img.data[k + 2] = Math.min(255, 244 * lit + 6);
      img.data[k + 3] = Math.round(a * (cover >= 1 ? 0.93 : 0.9) * 255);
    }
    g.putImageData(img, 0, 0);
    return c;
  });
  snowCache = { key, levels };
  return levels;
}

// ── On still water ──────────────────────────────────────────────────────────

// A skin of ice over a pond or a puddle: milky at the edges where it is
// thicker, clearer in the middle, with a few cracks and a dusting of snow.
// `reach`: how far from the centre the open water goes.
export function drawIce(ctx, o, reach) {
  const ice = weather.ice;
  if (ice <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, ice * 1.1);
  // Clear, dark ice in the middle, where the water is deep; white and
  // bubbly toward the shore, where it froze first.
  const g = ctx.createRadialGradient(o.x, o.y, reach * 0.15, o.x, o.y, reach);
  g.addColorStop(0, 'rgba(186,206,222,0.12)');
  g.addColorStop(0.6, 'rgba(204,220,232,0.3)');
  g.addColorStop(0.88, 'rgba(226,236,244,0.42)');
  g.addColorStop(1, 'rgba(232,240,246,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(o.x, o.y, reach, 0, Math.PI * 2);
  ctx.fill();
  // Cracks radiate from a point or two, where something once pressed.
  ctx.strokeStyle = 'rgba(250,252,255,0.4)';
  ctx.lineWidth = 0.6;
  const s = seedFor(o);
  for (let i = 0; i < 5; i++) {
    let a = hash(s, i, 1) * Math.PI * 2;
    let x = o.x + Math.cos(a) * reach * 0.2 * hash(s, i, 2);
    let y = o.y + Math.sin(a) * reach * 0.2 * hash(s, i, 3);
    ctx.beginPath();
    ctx.moveTo(x, y);
    const len = reach * (0.3 + hash(s, i, 4) * 0.5);
    for (let k = 0; k < 4; k++) {
      a += (hash(s, i, 5 + k) - 0.5) * 0.9;
      x += Math.cos(a) * len / 4;
      y += Math.sin(a) * len / 4;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  if (weather.snow > 0.05) {
    ctx.globalAlpha = Math.min(1, ice * weather.snow);
    ctx.fillStyle = 'rgba(236,242,248,0.55)';
    ctx.beginPath();
    ctx.arc(o.x, o.y, reach, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
