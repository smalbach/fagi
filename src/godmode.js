// God mode: pick a Fagi in a running session and set her numbers by hand.
//
// What can be touched, and only while its system is on:
//   state   hunger, thirst, energy, health, temperature, sleep pressure, sodium
//   body    her own draw (variation.js): speed, reserves, metabolism, thirst,
//           insulation, sight, smell, memory, poison tolerance, lifespan
//   habits  the rung each habit sits on (habits.js)
//
// A body trait lives in her genome's `vary`, so biology.js folds it into her
// body like any draw; with VARY.births on, her young inherit it too. An edit
// never bypasses the simulation: hunger set to the max kills her of hunger on
// the next frame, as it would have anyway.
//
// Every edit is recorded ('god' event) and marks the world (world.god): a
// session touched by hand is no longer a clean run, and whoever reads its
// data has to know.

import { HUNGER, THIRST, HEALTH, THERMAL, SLEEP, TASTE, HABITS } from './config.js';
import { bodyFor, energyMax } from './biology.js';
import { VARY_TRAITS } from './variation.js';
import { HABIT_SPECS, HABIT_IDS, createHabits } from './habits.js';
import { createGenome } from './generations.js';
import { record } from './world.js';

// How far a god may push a body trait: further than nature's VARY.limit.
export const GOD_BODY_RANGE = [0.3, 2.5];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Sets one body trait and rebuilds her body, keeping her energy as a share
// of her (new) maximum.
function setVary(f, k, v) {
  f.genome ??= createGenome();
  f.genome.vary = { ...(f.genome.vary ?? {}), [k]: v };
  const full = energyMax(f) > 0 ? f.energy / energyMax(f) : 1;
  f.body = bodyFor(f.sex, f.genome, f.morph);
  f.energy = full * energyMax(f);
}

function setRung(f, id, rung) {
  f.brain.habits ??= createHabits();
  f.brain.habits[id] ??= { rung: null, calmSince: 0, moves: [] };
  f.brain.habits[id].rung = rung;
  f.brain.version = (f.brain.version ?? 0) + 1;
}

// Names, in both languages.
const BODY_LABEL = {
  speed: ['Speed', 'Velocidad'], energyMax: ['Reserves', 'Reservas'], metabolism: ['Metabolism', 'Metabolismo'],
  thirst: ['Thirstiness', 'Sed (ritmo)'], insulation: ['Insulation', 'Aislamiento'], view: ['Sight', 'Vista'],
  smell: ['Smell', 'Olfato'], memory: ['Memory', 'Memoria'], tolerance: ['Poison tolerance', 'Tolerancia al veneno'],
  life: ['Lifespan', 'Longevidad'],
};
const HABIT_LABEL = {
  tasteAt: ['Tastes new fruit from hunger', 'Prueba fruta nueva desde hambre'],
  hungerAt: ['Hunger urgent from', 'Hambre urgente desde'],
  thirstAt: ['Thirst urgent from', 'Sed urgente desde'],
  restAt: ['Rests at energy', 'Descansa con energía'],
  reserve: ['Rations that are enough', 'Raciones que le bastan'],
};

// Every parameter: group, label [en, es], range, how to read and write it,
// and whether its system is on now (`on`, absent = always).
export const GOD_PARAMS = [
  { id: 'hunger', group: 'state', label: ['Hunger', 'Hambre'], min: 0, max: () => HUNGER.max, step: 1,
    get: (f) => f.hunger, set: (f, v) => { f.hunger = v; } },
  { id: 'thirst', group: 'state', label: ['Thirst', 'Sed'], min: 0, max: () => THIRST.max, step: 1,
    get: (f) => f.thirst, set: (f, v) => { f.thirst = v; } },
  { id: 'energy', group: 'state', label: ['Energy', 'Energía'], min: 0, max: (f) => energyMax(f), step: 1,
    get: (f) => f.energy, set: (f, v) => { f.energy = v; } },
  { id: 'health', group: 'state', label: ['Health', 'Salud'], min: 0, max: () => HEALTH.max, step: 1,
    on: () => HEALTH.enabled, get: (f) => f.health ?? HEALTH.max, set: (f, v) => { f.health = v; } },
  { id: 'temperature', group: 'state', label: ['Body temperature °C', 'Temperatura corporal °C'],
    min: () => THERMAL.lethalMin, max: () => THERMAL.lethalMax, step: 0.5,
    on: () => THERMAL.enabled, get: (f) => f.temperature, set: (f, v) => { f.temperature = v; } },
  { id: 'sleepPressure', group: 'state', label: ['Sleep pressure', 'Presión de sueño'], min: 0, max: 1, step: 0.01,
    on: () => SLEEP.enabled, get: (f) => f.sleepPressure, set: (f, v) => { f.sleepPressure = v; } },
  { id: 'sodium', group: 'state', label: ['Sodium', 'Sodio'], min: 0, max: 1, step: 0.01,
    on: () => TASTE.enabled && TASTE.salt, get: (f) => f.sodium ?? 1, set: (f, v) => { f.sodium = v; } },

  ...VARY_TRAITS.map((k) => ({
    id: `body.${k}`, group: 'body', label: BODY_LABEL[k] ?? [k, k], min: GOD_BODY_RANGE[0], max: GOD_BODY_RANGE[1], step: 0.01,
    get: (f) => f.genome?.vary?.[k] ?? 1, set: (f, v) => setVary(f, k, v),
  })),

  ...HABIT_IDS.map((id) => ({
    id: `habit.${id}`, group: 'habits', label: HABIT_LABEL[id] ?? [id, id], min: 0, max: HABIT_SPECS[id].arms.length - 1, step: 1,
    on: () => HABITS.enabled,
    get: (f) => rungOf(f, id), set: (f, v) => setRung(f, id, v),
    show: (v) => String(HABIT_SPECS[id].arms[v]),   // the rung's value, not its index
  })),
];

// The rung a habit is on; never moved, the one closest to its factory value.
function rungOf(f, id) {
  const r = f.brain?.habits?.[id]?.rung;
  if (r != null) return r;
  const spec = HABIT_SPECS[id];
  const v = spec.factory();
  return spec.arms.reduce((best, a, i) => (Math.abs(a - v) < Math.abs(spec.arms[best] - v) ? i : best), 0);
}

const valueOf = (x, f) => (typeof x === 'function' ? x(f) : x);

export const paramById = (id) => GOD_PARAMS.find((p) => p.id === id) ?? null;

// The parameters that mean something now, with their range for this Fagi.
export function godParams(f) {
  return GOD_PARAMS.filter((p) => !p.on || p.on()).map((p) => ({
    ...p, min: valueOf(p.min, f), max: valueOf(p.max, f), value: p.get(f),
  }));
}

// Sets one parameter (clamped to its range). Returns { from, to }, or null if
// nothing could be set (unknown, off, or she is dead). `log` false leaves
// no event (while a slider is being dragged; the drag's end records it).
export function godSet(world, f, id, value, { log = true, from } = {}) {
  const p = paramById(id);
  if (!p || !f?.alive || (p.on && !p.on()) || !Number.isFinite(value)) return null;
  const before = p.get(f);
  let to = clamp(value, valueOf(p.min, f), valueOf(p.max, f));
  if (p.step >= 1) to = Math.round(to);
  p.set(f, to);
  if (log) noteGod(world, f, id, from ?? before, to);
  return { from: before, to };
}

// Records a finished edit, and marks the session as touched by hand.
export function noteGod(world, f, param, from, to) {
  if (!world) return;
  world.god = (world.god ?? 0) + 1;
  f.god = (f.god ?? 0) + 1;
  record(world, 'god', { id: f.id ?? null, param, from: round(from), to: round(to) });
}

const round = (v) => (Number.isFinite(v) ? Math.round(v * 1000) / 1000 : v);

// Shortcuts: several parameters at once, each recorded.
export const GOD_PRESETS = {
  // Fed, watered, rested and healed.
  restore: (f) => ({ hunger: 0, thirst: 0, energy: energyMax(f), health: HEALTH.max, sleepPressure: 0, sodium: 1 }),
  // Back to the species' standard body.
  standardBody: () => Object.fromEntries(VARY_TRAITS.map((k) => [`body.${k}`, 1])),
};

export function godPreset(world, f, name) {
  const values = GOD_PRESETS[name]?.(f);
  if (!values || !f?.alive) return 0;
  let n = 0;
  for (const [id, v] of Object.entries(values)) {
    const p = paramById(id);
    if (!p || (p.on && !p.on()) || p.get(f) === v) continue;
    if (godSet(world, f, id, v)) n++;
  }
  return n;
}
