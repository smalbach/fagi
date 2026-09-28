// Habits: learning how to behave, not only what is good.
//
// decision.js is a fixed hierarchy (survive, endure, provide, explore) and it
// stays that way: it is her safety net. But some of its steps hang on a
// number: how hungry before food becomes urgent, how tired before resting,
// how big a reserve to keep... Those numbers are her habits, and she tunes
// them from what happens to her.
//
// Each habit moves along a short ladder of values, one rung at a time, like a
// staircase in a psychophysics lab:
//   - a scare moves it one rung toward caution (hunger at 85% because she
//     went for food too late: next time she goes earlier);
//   - a waste, or a long calm, moves it one rung back toward boldness (rations
//     spoiling in the pantry: next time she stores less).
// So each habit settles where scares are rare but caution costs little, and
// every move has a reason she can say ("twice I nearly starved on the way").
//
// With HABITS.enabled = 0, or while a habit has never moved, it reads exactly
// the factory value in config.js: learning a habit changes nothing until
// there is a reason to.

import { HABITS, CARRY, NEEDS, ENERGY, NEST, HUNGER, THIRST, BASELINE } from './config.js';

// safer: which way along `arms` is more cautious (-1 = toward the start).
// factory: the config.js value it stands for while it has never moved.
export const HABIT_SPECS = {
  // Hunger (0–100) from which she eats a fruit she has never tasted instead of
  // carrying it home. Lower = she tastes before she stores.
  tasteAt: { arms: [0, 15, 30, 45], safer: -1, factory: () => CARRY.eatBelow },
  // Hunger (fraction) from which going for food is urgent.
  hungerAt: { arms: [0.35, 0.45, 0.55, 0.65], safer: -1, factory: () => NEEDS.critical },
  // Thirst (fraction) from which going for water is urgent.
  thirstAt: { arms: [0.35, 0.45, 0.55, 0.65], safer: -1, factory: () => NEEDS.critical },
  // Energy from which she stops to rest.
  restAt: { arms: [10, 22, 35, 50], safer: 1, factory: () => ENERGY.tired },
  // Rations in the pantry she counts as enough.
  reserve: { arms: [6, 12, 18, 24], safer: 1, factory: () => NEST.full },
};

export const HABIT_IDS = Object.keys(HABIT_SPECS);

// The rung closest to the factory value.
function startRung(spec) {
  const f = spec.factory();
  return spec.arms.reduce((best, v, i) => (Math.abs(v - f) < Math.abs(spec.arms[best] - f) ? i : best), 0);
}

export function createHabits() {
  const out = {};
  for (const id of HABIT_IDS) out[id] = { rung: null, calmSince: 0, moves: [] };
  return out;
}

// The value a habit has now: the factory one until it has moved.
export function habit(fagi, id) {
  const spec = HABIT_SPECS[id];
  const h = fagi.brain?.habits?.[id];
  if (!HABITS.enabled || !h || h.rung == null) return spec.factory();
  return spec.arms[h.rung];
}

// One rung toward caution ('safer') or boldness ('bolder'), with the reason.
// Returns the move, or null if it was already at the end of the ladder.
export function move(fagi, id, dir, why) {
  if (!HABITS.enabled || !HABITS.learn || !BASELINE.learn) return null;
  const spec = HABIT_SPECS[id];
  const h = fagi.brain.habits[id];
  const from = h.rung ?? startRung(spec);
  const to = from + (dir === 'safer' ? spec.safer : -spec.safer);
  h.calmSince = fagi.age;
  if (to < 0 || to >= spec.arms.length) return null;
  h.rung = to;
  const m = { at: Math.round(fagi.age * 10) / 10, dir, from: spec.arms[from], to: spec.arms[to], why };
  h.moves.push(m);
  if (h.moves.length > HABITS.history) h.moves.shift();
  fagi.brain.lastHabit = { n: (fagi.brain.lastHabit?.n ?? 0) + 1, id, ...m };
  fagi.brain.version = (fagi.brain.version ?? 0) + 1;
  return m;
}

// --- what teaches them --------------------------------------------------------

// Rising edges: a scare counts once, when it starts, not every frame it lasts.
function edge(fagi, name, on) {
  const s = fagi.habitSeen ?? (fagi.habitSeen = {});
  const was = s[name];
  s[name] = on;
  return on && !was;
}

// Every step, after her needs have grown. `pantry` is { stored, edible }: what
// she believes is in the pantry and how much of it she would eat. Only a
// pantry that is really empty asks for a bigger reserve; one full of what harms
// her asks her to taste before storing (storedHarm), not to store more.
export function observeHabits(fagi, pantry) {
  if (!HABITS.enabled || !fagi.brain?.habits) return;
  const hungerU = fagi.hunger / HUNGER.max;
  const thirstU = fagi.thirst / THIRST.max;

  if (edge(fagi, 'hunger', hungerU >= HABITS.scare)) {
    move(fagi, 'hungerAt', 'safer', { key: 'habit.why.hunger', params: { v: Math.round(hungerU * 100) } });
    if (pantry.stored === 0 && fagi.pantryAt != null) {
      move(fagi, 'reserve', 'safer', { key: 'habit.why.emptyPantry' });
    }
  }
  if (edge(fagi, 'thirst', thirstU >= HABITS.scare)) {
    move(fagi, 'thirstAt', 'safer', { key: 'habit.why.thirst', params: { v: Math.round(thirstU * 100) } });
  }
  if (edge(fagi, 'exhausted', fagi.energy <= 0)) {
    move(fagi, 'restAt', 'safer', { key: 'habit.why.exhausted' });
  }

  // A long calm: the caution she keeps may be costing more than it saves.
  if (HABITS.relax) {
    for (const id of ['hungerAt', 'thirstAt', 'restAt']) {
      const h = fagi.brain.habits[id];
      if (h.rung == null || fagi.age - h.calmSince < HABITS.calm) continue;
      move(fagi, id, 'bolder', { key: 'habit.why.calm', params: { sec: { dur: HABITS.calm } } });
    }
  }
}

// The first bite of a kind she had stored without tasting it, and it was bad:
// she filled the pantry with something that harms her.
export function storedHarm(fagi, key, firstBite, reward) {
  if (firstBite && reward < 0) move(fagi, 'tasteAt', 'safer', { key: 'habit.why.storedHarm', params: { what: { key: `type.${key}` } } });
}

// Rations that spoiled in the pantry since she last looked: she stored more
// than she eats.
export function spoiledRations(fagi, count) {
  if (count > 0) move(fagi, 'reserve', 'bolder', { key: 'habit.why.spoiled', params: { n: count } });
}

// Dying is the worst scare of all: it only helps the next life, if she
// recovers what this one learned.
export function deathLesson(fagi, cause, pantry) {
  if (cause === 'hunger') {
    move(fagi, 'hungerAt', 'safer', { key: 'habit.why.died', params: { cause: { key: 'cause.hunger' } } });
    if (pantry.stored === 0) move(fagi, 'reserve', 'safer', { key: 'habit.why.emptyPantry' });
  } else if (cause === 'thirst') {
    move(fagi, 'thirstAt', 'safer', { key: 'habit.why.died', params: { cause: { key: 'cause.thirst' } } });
  } else if (cause === 'poison') {
    // Poisoned: what killed her was eating what she had never tasted.
    move(fagi, 'tasteAt', 'safer', { key: 'habit.why.died', params: { cause: { key: 'cause.poison' } } });
  }
}

// --- saving -------------------------------------------------------------------

// Only the habits that moved, with their history: { id: { rung, moves } }.
export function habitsSnapshot(habits) {
  const out = {};
  for (const [id, h] of Object.entries(habits ?? {})) if (h.rung != null) out[id] = { rung: h.rung, moves: h.moves };
  return out;
}

// Back from a snapshot or an imported file; anything malformed is ignored.
export function restoreHabits(saved) {
  const out = createHabits();
  for (const [id, h] of Object.entries(saved ?? {})) {
    const spec = HABIT_SPECS[id];
    if (!spec || !h || !Number.isInteger(h.rung) || h.rung < 0 || h.rung >= spec.arms.length) continue;
    out[id].rung = h.rung;
    out[id].moves = Array.isArray(h.moves) ? h.moves.slice(-HABITS.history).filter((m) => m && typeof m === 'object') : [];
  }
  return out;
}
