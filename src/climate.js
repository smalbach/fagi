// The climate as the land shows it.
//
// The settings already decide how warm the air is (CYCLE.mean), how often and
// how long it rains (RAIN.every, RAIN.duration) and whether winters come
// (SEASONS). The simulation reads them; this module turns the same numbers into
// what the ground should look like, so the map tells the climate at a glance:
//
//   · `baseClimate()`: the climate of the place, from the settings alone. A dry
//     and hot one bakes sandy, cracked earth with straw tufts; a rainy one, a
//     dark, mossy forest floor; a cold one, a pale tundra of lichen and gravel.
//   · `airTemp(world)`: the air right now (the day, the season).
//   · `leafFallOf(season)`: how far deciduous trees are into dropping their
//     leaves, which only happens where winter is actually cold.
//
// Nothing here is state and nothing draws: render-side modules call it.

import { CYCLE, RAIN, SEASONS } from './config.js';
import { cycleAt } from './cycle.js';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (a, b, x) => { const k = clamp01((x - a) / (b - a)); return k * k * (3 - 2 * k); };

// Share of the time it rains, at the defaults ≈ 0.074 (a shower of ~26 s every
// ~5.5 min). Twice that is a very rainy place; a tenth of it, a dry one.
const RAINY = 0.15;

export function baseClimate() {
  const mean = CYCLE.mean;
  const every = (RAIN.every.min + RAIN.every.max) / 2;
  const lasts = (RAIN.duration.min + RAIN.duration.max) / 2;
  const share = lasts / Math.max(1, every + lasts);
  const wet = clamp01(share / RAINY);                       // 0 desert … 0.5 defaults … 1 rainforest
  const heat = Math.max(-1, Math.min(1, (mean - 22) / 16)); // -1 freezing … 0 defaults … 1 scorching
  const hotYears = SEASONS.enabled ? SEASONS.hotYears ?? 0 : 0;
  // Dry where little rain falls, and drier still where the heat evaporates it.
  // Around the defaults both are 0: the ground stays the temperate one.
  const arid = clamp01((0.42 - wet) * 2 + Math.max(0, heat - 0.15) * 0.65 + hotYears * 0.15);
  // Lush where it rains a lot and the heat doesn't burn it off.
  const lush = clamp01((wet - 0.6) * 2.5 - Math.max(0, heat - 0.6) * 0.5);
  // Cold where the average day stays near freezing: short, pale vegetation.
  const cold = clamp01((8 - mean) / 14);
  return { mean, wet, arid, lush, cold };
}

// A short string that changes only when the climate changes visibly: the
// baked ground is repainted when it does.
export function climateKey(c = baseClimate()) {
  const q = (v) => Math.round(v * 20);
  return `${q(c.arid)}.${q(c.lush)}.${q(c.cold)}`;
}

// The air temperature (°C) now. With the day off there is no daily wave, but
// the place keeps its mean and the season still takes its degrees off.
export function airTemp(world) {
  if (CYCLE.enabled) return cycleAt(world?.time ?? 0).ambient;
  return CYCLE.mean - (world?.season?.cold ?? 0);
}

// How deep into shedding their leaves broadleaf trees are (0-1). Only where
// the winter gets cold: in a mild one trees stay green all year. A hot year's
// winter is "lean but not cold", so it sheds little; its summer drought
// browns the crowns a little instead.
export function leafFallOf(season) {
  if (!season?.on) return 0;
  const winterAir = CYCLE.mean - (SEASONS.winterCold ?? 0);
  const chill = clamp01((22 - winterAir) / 12);
  if (season.hot) return clamp01(-season.cold / 12) * 0.3;
  return smooth(0.05, 0.85, season.depth) * chill;
}
