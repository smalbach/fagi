// Seasons (SEASONS): years with a lean, cold winter and a generous summer.
//
// A year lasts SEASONS.year seconds. Winter is a smooth dip centred at
// SEASONS.winterAt of the year and SEASONS.winter of it wide: how deep it is
// right now, 0-1, is `depth`. At depth 1 trees bear SEASONS.winterFruit of
// their rate and the air is SEASONS.winterCold degrees colder; out of winter
// they bear SEASONS.summerFruit. That is the pressure that decides which
// bodies get through (morph.js): reserves, a gut that takes more from little,
// muscle to reach far trees, a memory of where food was.
//
// Some years may come hot instead (hotYears): a winter that is lean but not
// cold, and a summer summerHeat °C hotter. A cold year favours a big body
// (it keeps its warmth), a hot one a small one (its tracheae keep up): the
// same body that won last year may lose this one. `persist` is how often a
// year repeats the kind of the one before.
//
// Predictable (unpredictable = 0), every winter is the same, so a lineage can
// come to expect it. Unpredictable, each year draws how hard its winter is,
// how long and when it comes, so what one year taught may mislead the next
// (de Bruin et al. 2026: what a parent lived helps a daughter only when the
// change can be foreseen).
//
// The world's turn (simulation.js) works out the season once per step and
// keeps it in world.season; the sky (cycle.js) and the trees read it from
// there through `seasonNow`. A year's draws happen when it starts, from the
// world's own stream, and only with the seasons on and either unpredictable
// winters or hot years.

import { SEASONS } from './config.js';
import { record } from './world.js';

const NONE = Object.freeze({ on: false, year: 1, depth: 0, fruit: 1, cold: 0, far: null, name: 'none' });
let current = NONE;

// The season of the world being stepped (one world at a time).
export const seasonNow = () => current;

// A year's winter: where its centre falls, how wide and how hard.
function yearOf(world, n) {
  world.years ??= {};
  if (!world.years[n]) {
    const s = SEASONS.unpredictable ? SEASONS.spread : 0;
    const draw = () => (s ? Math.random() * 2 - 1 : 0);
    world.years[n] = {
      at: SEASONS.winterAt + draw() * s * 0.15,
      width: SEASONS.winter * (1 + draw() * s * 0.5),
      hard: Math.max(0, 1 + draw() * s),
      hot: kindOf(world, n),
      far: reachOf(world, n),
    };
  }
  return world.years[n];
}

// Whether year n comes hot: with hotYears on, the year before's kind is kept
// with chance `persist`, else drawn afresh. Draws nothing with hotYears at 0.
function kindOf(world, n) {
  const p = SEASONS.hotYears ?? 0;
  if (!p) return false;
  const before = n > 1 ? yearOf(world, n - 1).hot : null;
  if (before != null && Math.random() < (SEASONS.persist ?? 0)) return before;
  return Math.random() < p;
}

// Whether year n's fruit is far from the nest, near it, or neither (null,
// farYears off). Same rule as kindOf: kept with chance `persist`, else drawn.
function reachOf(world, n) {
  const p = SEASONS.farYears ?? 0;
  if (!p) return null;
  const before = n > 1 ? yearOf(world, n - 1).far : null;
  if (before != null && Math.random() < (SEASONS.persist ?? 0)) return before;
  return Math.random() < p;
}

// How deep into winter the year is at `y` (0-1 of the year): 0 outside it,
// 1 at its centre, a smooth cosine in between.
function depthAt(w, y) {
  let d = Math.abs(y - w.at);
  d = Math.min(d, 1 - d);   // the year wraps around
  return d >= w.width / 2 ? 0 : 0.5 * (1 + Math.cos((2 * Math.PI * d) / w.width));
}

// How deep into summer at time t: 1 at the opposite side of the year from
// winter's centre, 0 at that centre, a cosine between.
function summerAt(w, t) {
  const y = (t % SEASONS.year) / SEASONS.year;
  return 0.5 * (1 - Math.cos(2 * Math.PI * (y - w.at)));
}

export function updateSeasons(world) {
  if (!SEASONS.enabled) { current = NONE; world.season = null; return; }
  const t = world.time ?? 0;
  const n = Math.floor(t / SEASONS.year) + 1;
  const w = yearOf(world, n);
  const depth = Math.min(1, depthAt(w, (t % SEASONS.year) / SEASONS.year) * w.hard);
  const name = depth > 0.5 ? 'winter' : depth > 0 ? 'autumn' : 'summer';
  current = {
    on: true,
    year: n,
    depth,
    fruit: SEASONS.summerFruit + (SEASONS.winterFruit - SEASONS.summerFruit) * depth,
    cold: w.hot ? -SEASONS.summerHeat * summerAt(w, t) : SEASONS.winterCold * depth,
    hot: w.hot,
    far: w.far ?? null,
    name,
  };
  if (world.season?.name !== name) record(world, 'season', { name, year: n });
  world.season = current;
}
