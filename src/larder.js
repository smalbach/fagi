// The larder (LARDER, phase 9 D, spec §12.11): a nest that fills up, and a
// pantry she has to guess between visits.
//
// Without it, what she knows of the pantry is the last look (nest.js writes
// fagi.pantry only when she is inside), and the nest takes whatever she brings.
// With it:
//   - the nest holds LARDER.capacity rations. Arriving loaded to a full nest
//     is a surprise she only has on arrival, and a decision she takes alone.
//     If some of what fills it is what she avoids, she carries one of those
//     out (the refuse heap of ants) and stores hers. If it is full of good
//     food: hungry, she eats what she carried; if not, she leaves it at the
//     door, remembers how full it was, and doesn't haul food home while she
//     predicts it still that full. The trip was more than the colony needed,
//     so her reserve habit moves one rung down (habits.js), as spoiled
//     rations already do;
//   - between visits she predicts the pantry: what she last saw, less what
//     she believes it loses per second. Each visit tells her how wrong she
//     was, and she corrects that rate by the surprise. It can come out
//     negative: in a colony, sisters fill the pantry while she is away.
//     Her urge to go out for food follows the prediction, not the old look.
//
// Each learns her own rate from her own visits, so two sisters that come home
// at different times end up expecting different pantries.

import { feltHunger } from './stomach.js';
import { LARDER, HUNGER } from './config.js';
import { addPoint, record, stockCount, takeFromNest } from './world.js';
import { edibleCount, verdict } from './learned/rules.js';
import { radiusOf } from './obstacles.js';
import { move } from './habits.js';
import { eat } from './feeding.js';

const larderOf = (fagi) => (fagi.brain.larder ??= {
  rate: LARDER.prior, visits: 0, surprise: 0, absSurprise: 0, full: 0, ate: 0, dropped: 0, cleared: 0, fullAt: null,
});

// How much of the pantry she believes she would eat, right now.
export function pantryEstimate(fagi) {
  const seen = edibleCount(fagi, fagi.pantry);
  if (!LARDER.enabled || !LARDER.learn || fagi.pantryAt == null) return seen;
  const l = larderOf(fagi);
  return Math.min(LARDER.capacity, Math.max(0, seen - l.rate * (fagi.age - fagi.pantryAt)));
}

// On entering, before she touches anything: what she sees against what she
// predicted, and her rate corrected by the surprise.
export function lookInLarder(fagi, nestObj) {
  if (!LARDER.enabled || fagi.pantryAt == null) return;
  const gap = fagi.age - fagi.pantryAt;
  if (gap < LARDER.minGap) return;
  const l = larderOf(fagi);
  const before = edibleCount(fagi, fagi.pantry);
  const now = edibleCount(fagi, nestObj.stock);
  const predicted = pantryEstimate(fagi);
  if (LARDER.learn) {
    const implied = (before - now) / gap;
    l.rate += LARDER.rate * (implied - l.rate);
    l.rate = Math.max(-LARDER.maxRate, Math.min(LARDER.maxRate, l.rate));
  }
  l.surprise = now - predicted;   // + = fuller than she thought
  l.visits += 1;
  l.absSurprise += Math.abs(l.surprise);
  fagi.brain.lastLarder = { n: (fagi.brain.lastLarder?.n ?? 0) + 1, predicted, now };
}

// Is there room for one more?
export const larderFull = (nestObj) => LARDER.enabled && stockCount(nestObj.stock) >= LARDER.capacity;

// Does she believe there is room at home for what she would carry? Only a
// nest she found full of good food says no, and only while she predicts it
// still that full.
export function roomAtHome(fagi) {
  const l = fagi.brain.larder;
  if (!LARDER.enabled || l?.fullAt == null || fagi.pantryAt == null) return true;
  const rate = LARDER.learn ? l.rate : 0;
  return stockCount(fagi.pantry) - rate * (fagi.age - fagi.pantryAt) < l.fullAt;
}

// A fruit at the door of the nest, on her side: a real fruit that ages and
// rots like any other, and that anyone can pick up.
function atTheDoor(fagi, world, nestObj, type, age, variant = null) {
  const r = radiusOf(nestObj) + 8;
  const a = Math.atan2(fagi.y - nestObj.y, fagi.x - nestObj.x);
  const p = addPoint(world, nestObj.x + Math.cos(a) * r, nestObj.y + Math.sin(a) * r, type, 'nest');
  p.age = age;
  if (variant) p.variant = variant;
  return p;
}

// Something in the pantry she avoids, to carry out: the oldest of its kind.
function refuse(fagi, world, nestObj) {
  const type = Object.keys(nestObj.stock).find((k) => nestObj.stock[k] > 0 && verdict(fagi, 'eat', k) === 'avoid');
  if (!type) return null;
  const age = Math.max(0, ...(nestObj.ages[type] ?? [0]));
  takeFromNest(nestObj, type);
  record(world, 'nest_take', { what: type, nest: nestObj.id, out: 1 });
  return { type, age };
}

// She came in loaded and there is no room. Returns what she did; 'cleared'
// leaves her load in her hands, for the nest to store as usual.
export function nestFull(fagi, world, nestObj) {
  const l = larderOf(fagi);
  l.full += 1;
  const out = refuse(fagi, world, nestObj);
  if (out) {
    // Refuse smells of the refuse heap: nobody carries it home again (feeding.js).
    atTheDoor(fagi, world, nestObj, out.type, out.age).refuse = true;
    l.cleared += 1;
    record(world, 'nest_full', { what: fagi.carrying.type, did: 'cleared', out: out.type });
    fagi.lastNestFull = { n: (fagi.lastNestFull?.n ?? 0) + 1, what: fagi.carrying.type, did: 'cleared', out: out.type };
    return 'cleared';
  }
  const load = fagi.carrying;
  fagi.carrying = null;
  l.fullAt = stockCount(nestObj.stock);
  let did;
  if (feltHunger(fagi) / HUNGER.max >= LARDER.eatIfHunger) {
    eat(fagi, load.type, { variant: load.variant });
    l.ate += 1;
    did = 'ate';
  } else {
    atTheDoor(fagi, world, nestObj, load.type, load.age ?? 0, load.variant);
    l.dropped += 1;
    did = 'dropped';
  }
  move(fagi, 'reserve', 'bolder', { key: 'habit.why.nestFull' });
  record(world, 'nest_full', { what: load.type, did });
  fagi.lastNestFull = { n: (fagi.lastNestFull?.n ?? 0) + 1, what: load.type, did };
  return did;
}

// What she believes of the pantry, for the brain map and the inspector.
export function larderView(fagi) {
  if (!LARDER.enabled || fagi.pantryAt == null) return null;
  const l = fagi.brain.larder;
  return {
    seen: edibleCount(fagi, fagi.pantry), ago: fagi.age - fagi.pantryAt, predicted: pantryEstimate(fagi),
    rate: l?.rate ?? LARDER.prior, full: l?.full ?? 0, room: roomAtHome(fagi), capacity: LARDER.capacity,
  };
}

// What batch reports of her larder.
export function larderSummary(fagi) {
  const l = fagi.brain.larder;
  const r3 = (v) => Math.round(v * 1000) / 1000;
  if (!l) return { rate: null, visits: 0, meanSurprise: null, full: 0, ate: 0, dropped: 0, cleared: 0 };
  return {
    rate: r3(l.rate), visits: l.visits, meanSurprise: l.visits ? r3(l.absSurprise / l.visits) : null,
    full: l.full, ate: l.ate, dropped: l.dropped, cleared: l.cleared,
  };
}
