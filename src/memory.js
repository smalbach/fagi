// Fagi's memory.
//
// It copies three things from real insects:
//
//   1. A memory has VALUE and CONFIDENCE. Value is what was learned;
//      confidence, how much she trusts it. Decisions weigh the product.
//   2. There are three stages: short, medium and long. It moves up through repetition, but only
//      SPACED repetitions count: five bites in a row teach
//      less than five spread out over time.
//   3. Nothing is erased: what drops is confidence. That's why a forgotten memory
//      can weigh again as soon as it's confirmed once.
//
// For places she also remembers "roughly where": the position
// blurs while she doesn't see it again, so she has to search on arrival.

import { MEMORY } from './config.js';

const STAGES = ['short', 'medium', 'long'];
const DECAY = { short: 'decayShort', medium: 'decayMedium', long: 'decayLong' };

function newMemoryEntry() {
  return { value: 0, confidence: 0, confirms: 0, lastAt: -Infinity, stage: 'short', tries: 0 };
}

// She's born knowing nothing: not a single belief about anything on the map.
// Each key is created the first time it's needed (recall, below), not
// before. Nor does it load what was saved from another game by itself: that's a separate
// action, "Recover what was learned" (learned/store.js), not something automatic.
export function createMemory() {
  return { facts: {}, places: {} };
}

export function recall(mem, key) {
  return mem.facts[key] ?? (mem.facts[key] = newMemoryEntry());
}

// How much a memory weighs when deciding. Confidence modulates it, it doesn't erase it:
// with confidence at zero the residue of what was learned remains (MEMORY.floor).
export function weight(mem, key) {
  const r = recall(mem, key);
  return r.value * (MEMORY.floor + (1 - MEMORY.floor) * r.confidence);
}

// Same, but without creating the belief if it doesn't exist yet: to query something
// she may never have experienced (rain, a puddle) without it showing up as
// "untried" among what she believes.
export function peekWeight(mem, key) {
  return mem.facts[key] ? weight(mem, key) : 0;
}

// Is she still curious about this? She is if she hasn't tried it or no longer trusts it.
export function curious(mem, key, triesNeeded) {
  const r = recall(mem, key);
  return r.tries < triesNeeded || r.confidence < MEMORY.minConfidence;
}

function promote(r) {
  if (r.confirms >= MEMORY.toLong) r.stage = 'long';
  else if (r.confirms >= MEMORY.toMedium) r.stage = 'medium';
}

function demote(r) {
  const i = STAGES.indexOf(r.stage);
  r.stage = STAGES[Math.max(0, i - 1)];
}

// A new experience. `reward` is what she felt; `now`, Fagi's age.
export function reinforce(mem, key, reward, now, learnRate) {
  const r = recall(mem, key);
  const first = r.tries === 0;
  const coherent = first || Math.sign(reward) === Math.sign(r.value) || r.value === 0;
  const spaced = now - r.lastAt >= MEMORY.spacing;

  const before = { value: r.value, confidence: r.confidence, stage: r.stage };

  // Value always moves with the good old delta rule.
  r.value += learnRate * (reward - r.value);
  r.value = Math.min(1, Math.max(-1, r.value));
  r.tries += 1;
  r.lastAt = now;

  if (first) {
    r.confidence = MEMORY.first;
  } else if (coherent) {
    // Confirmation. Spaced consolidates; back-to-back barely adds anything.
    const gain = MEMORY.gain * (spaced ? 1 : MEMORY.massedGain);
    r.confidence += gain * (1 - r.confidence);
    if (spaced) { r.confirms += 1; promote(r); }
  } else {
    // Letdown: she trusts it much less and the memory becomes labile again.
    r.confidence *= MEMORY.contradiction;
    r.confirms = Math.max(0, r.confirms - 1);
    demote(r);
  }
  r.confidence = Math.min(1, Math.max(0, r.confidence));

  return { before, after: { value: r.value, confidence: r.confidence, stage: r.stage },
           kind: first ? 'first' : coherent ? (spaced ? 'confirms' : 'repeats') : 'contradicts' };
}

// --- places ---
// A remembered place stores where she THINKS it is (x, y), by how much she might be off
// (error) and the real object she saw, to know whether it still exists.
export function rememberPlace(mem, kind, obj, now) {
  const p = mem.places[kind] ?? (mem.places[kind] = { ...newMemoryEntry(), x: obj.x, y: obj.y, error: 0, ref: obj });
  p.ref = obj;
  p.x = obj.x;
  p.y = obj.y;
  p.error = 0;

  const spaced = now - p.lastAt >= MEMORY.spacing;
  p.lastAt = now;
  p.tries += 1;
  p.confidence += (p.tries === 1 ? MEMORY.first : MEMORY.gain * (spaced ? 1 : MEMORY.massedGain)) * (1 - p.confidence);
  p.confidence = Math.min(1, p.confidence);
  if (spaced) { p.confirms += 1; promote(p); }
  return p;
}

// Under which name a body of water is remembered: the lake or a rain puddle.
export function waterPlaceKind(obj) {
  return obj?.type === 'puddle' ? 'puddle' : 'water';
}

export function recallPlace(mem, kind) {
  const p = mem.places[kind];
  return p && p.confidence > 0 ? p : null;
}

export function forgetPlace(mem, kind) {
  delete mem.places[kind];
}

// Time passes: confidence drops and places gradually blur.
export function decayMemory(mem, dt) {
  for (const r of Object.values(mem.facts)) {
    r.confidence = Math.max(0, r.confidence - MEMORY[DECAY[r.stage]] * dt);
  }
  for (const p of Object.values(mem.places)) {
    p.confidence = Math.max(0, p.confidence - MEMORY[DECAY[p.stage]] * dt);
    if (p.error < MEMORY.placeErrorMax) {
      p.error = Math.min(MEMORY.placeErrorMax, p.error + MEMORY.placeDrift * dt);
      // The remembered position drifts slowly: she remembers the area, not the point.
      p.x += (Math.random() - 0.5) * MEMORY.placeDrift * dt * 2;
      p.y += (Math.random() - 0.5) * MEMORY.placeDrift * dt * 2;
    }
  }
}

// Saving and recovering between games no longer lives here: it's learned/store.js,
// which saves facts AND rules together under a single explicit action ("Recover
// what was learned"), never at birth. This only forgets the PLACES (where the
// water is, where the tree is), which are never saved between games.
export function forgetPlaces(mem) {
  mem.places = {};
}
