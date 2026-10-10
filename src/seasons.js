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
// The time of year can be moved ahead by hand (the settings' buttons):
// world.seasonShift seconds are added to the world clock for the seasons
// alone; the day, ages and everything else keep the real clock.
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

// A replay sets the season it rebuilt from its events (recorder/replay.js),
// so the sky, the ground and the trees draw it; null puts them back to none.
export function setSeasonNow(season) {
  current = season?.on ? { ...NONE, ...season } : NONE;
}

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

// The seasons' clock: the world's, plus what was jumped by hand.
const clockOf = (world) => (world.time ?? 0) + (world.seasonShift ?? 0);

// Where the year is: its number, its winter and how far into it (0-1).
function placeOf(world) {
  const t = clockOf(world);
  const n = Math.floor(t / SEASONS.year) + 1;
  return { n, w: yearOf(world, n), y: (t % SEASONS.year) / SEASONS.year };
}

// The season as shown to the person: the lean time going into winter is
// autumn, coming out of it spring (the simulation only tells the depth).
function shownAt(w, y) {
  const depth = Math.min(1, depthAt(w, y) * w.hard);
  if (depth > 0.5) return 'winter';
  if (depth <= 0) return 'summer';
  const past = ((y - w.at + 1.5) % 1) - 0.5;   // signed, the year wrapping around
  return past < 0 ? 'autumn' : 'spring';
}

// The season now, its year and what comes next and in how many seconds
// (looked for within this year only: a later year isn't drawn before its
// time). null with the seasons off.
export function seasonView(world) {
  if (!SEASONS.enabled) return null;
  const { n, w, y } = placeOf(world);
  const name = shownAt(w, y);
  const step = 1 / 720;
  for (let k = y + step; k < 1; k += step) {
    const next = shownAt(w, k);
    if (next !== name) return { name, year: n, next, inSec: (k - y) * SEASONS.year };
  }
  return { name, year: n, next: null, inSec: (1 - y) * SEASONS.year };
}

// Moves the time of year ahead to the heart of a season ('spring', 'summer',
// 'autumn', 'winter'), turning the seasons on if they were off.
export function jumpSeason(world, season) {
  const { w, y } = placeOf(world);
  const target = {
    autumn: w.at - w.width * 0.3,
    winter: w.at,
    spring: w.at + w.width * 0.3,
    summer: w.at + 0.5,
  }[season];
  if (target == null) return;
  const ahead = (((target - y) % 1) + 1) % 1;
  world.seasonShift = (world.seasonShift ?? 0) + ahead * SEASONS.year;
  updateSeasons(world);
}

// What a recording keeps of the season: enough to draw it (the ground, the
// leaves, the cold) and to name it.
const DEPTH_STEP = 0.02;
function note(world, s) {
  const last = world.seasonNoted;
  if (last && last.name === s.name && last.year === s.year && last.shown === s.shown && Math.abs(last.depth - s.depth) < DEPTH_STEP) return;
  world.seasonNoted = s;
  record(world, 'season', s);
}

export function updateSeasons(world) {
  if (!SEASONS.enabled) {
    if (world.season) note(world, { name: 'none', year: 0, depth: 0, cold: 0, hot: false, shown: 'none' });
    current = NONE;
    world.season = null;
    return;
  }
  const t = clockOf(world);
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
  const r2 = (v) => Math.round(v * 100) / 100;
  note(world, { name, year: n, depth: r2(depth), cold: r2(current.cold), hot: Boolean(w.hot), shown: shownAt(w, (t % SEASONS.year) / SEASONS.year) });
  world.season = current;
}
