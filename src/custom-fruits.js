// Fruits the person makes (setup screen, fruit-editor.js): a name, a look, a
// smell, the tastes the tongue reads and what one does to the body, plus the
// tree that bears it. They go into POINT_TYPES next to the classic fruit, so
// eating, rotting, carrying, smelling and drawing handle them with no extra
// code — the same way the wild species of chemistry.js do.
//
// Fagi never reads a definition: she sees its color and shape, smells its
// smell, tastes its tastes and feels what it does. Which one is food and which
// is poison she has to find out, exactly as with any other fruit.
//
// The set is the session's: it is kept in the browser for the next setup,
// recorded at the start of a session and brought back by its replay.

import { POINT_TYPES, TREE } from './config.js';
import { COLOR_HEX, SHAPE_PAINTER, TRAITS, TASTES } from './chemistry.js';

const STORE_KEY = 'fagi.fruits';
export const FRUIT_PREFIX = 'fruit-';

// What a fruit can do on top of feeding, and the range each multiplier makes sense in.
export const FX_STATS = ['speed', 'viewRange', 'fovDeg', 'smell', 'hungerRate'];
export const SHAPES = TRAITS.shape;
export const SMELLS = TRAITS.smell;
export { TASTES };

export const isCustom = (key) => Boolean(POINT_TYPES[key]?.custom);

const clamp = (v, min, max, d) => (Number.isFinite(Number(v)) ? Math.min(max, Math.max(min, Number(v))) : d);
const newId = () => Math.random().toString(36).slice(2, 8);

// The named color closest to a hex: what she perceives of it (a trait she can
// learn from), whatever shade the person picked.
export function nearestColor(hex) {
  const rgb = (h) => {
    const n = parseInt(String(h).replace('#', '').padEnd(6, '0').slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [r, g, b] = rgb(hex);
  let best = 'red';
  let bestD = Infinity;
  for (const [name, h] of Object.entries(COLOR_HEX)) {
    const [r2, g2, b2] = rgb(h);
    const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (d < bestD) { bestD = d; best = name; }
  }
  return best;
}

// A fresh definition, harmless and mildly filling.
export function blankFruit(name = '') {
  return {
    id: newId(),
    name,
    color: '#e8903d',
    shape: 'round',
    smell: 'sweet',
    aroma: 130,
    radius: 6,
    life: 200,
    hunger: -20,
    thirst: 0,
    taste: { sweet: 0.6 },
    effects: [],
    tree: { interval: TREE.interval, maxNear: TREE.maxNear, count: 1 },
  };
}

// A definition as it arrives (saved, recorded, typed): every number in range,
// every name one that exists. Anything else is dropped, never trusted.
export function cleanFruit(raw) {
  const d = blankFruit();
  if (!raw || typeof raw !== 'object') return d;
  const taste = {};
  for (const t of TASTES) {
    const v = clamp(raw.taste?.[t], 0, 1, 0);
    if (v > 0) taste[t] = Math.round(v * 100) / 100;
  }
  return {
    id: /^[a-z0-9]{1,12}$/.test(raw.id ?? '') ? raw.id : d.id,
    name: String(raw.name ?? '').slice(0, 40),
    color: /^#[0-9a-fA-F]{6}$/.test(raw.color ?? '') ? raw.color : d.color,
    shape: SHAPES.includes(raw.shape) ? raw.shape : d.shape,
    smell: SMELLS.includes(raw.smell) ? raw.smell : d.smell,
    aroma: clamp(raw.aroma, 0, 400, d.aroma),
    radius: clamp(raw.radius, 3, 14, d.radius),
    life: clamp(raw.life, 0, 900, d.life),
    hunger: clamp(raw.hunger, -80, 60, d.hunger),
    thirst: clamp(raw.thirst, -50, 50, 0),
    taste,
    effects: (Array.isArray(raw.effects) ? raw.effects : [])
      .filter((e) => FX_STATS.includes(e?.stat))
      .slice(0, FX_STATS.length)
      .map((e) => ({ stat: e.stat, mult: clamp(e.mult, 0.1, 4, 1), sec: clamp(e.sec, 1, 120, 8) })),
    tree: {
      interval: clamp(raw.tree?.interval, 1, 120, d.tree.interval),
      maxNear: clamp(raw.tree?.maxNear, 1, 30, d.tree.maxNear),
      count: Math.round(clamp(raw.tree?.count, 0, 20, d.tree.count)),
    },
  };
}

export const keyOf = (def) => `${FRUIT_PREFIX}${def.id}`;

// What a definition is as a fruit type. Spicy burns (TASTE), as in the wild species.
export function specOfDef(def) {
  return {
    color: def.color,
    radius: def.radius,
    aroma: def.aroma,
    life: def.life,
    hunger: def.hunger,
    thirst: def.thirst,
    burn: def.taste.spicy ?? 0,
    effects: def.effects.map((e) => ({ ...e })),
    traits: { color: nearestColor(def.color), shape: def.shape, smell: def.smell },
    taste: { ...def.taste },
    painter: SHAPE_PAINTER[def.shape],
    tree: { ...def.tree },
    name: def.name,
    custom: true,
  };
}

let current = [];

// The session's fruit, replacing the previous set in POINT_TYPES.
export function registerFruits(defs) {
  for (const k of Object.keys(POINT_TYPES)) if (POINT_TYPES[k].custom) delete POINT_TYPES[k];
  current = (defs ?? []).map(cleanFruit);
  for (const def of current) POINT_TYPES[keyOf(def)] = specOfDef(def);
  return current;
}

// A replay brings back its session's fruit without dropping the ones being edited.
export function addFruits(defs) {
  for (const raw of defs ?? []) {
    const def = cleanFruit(raw);
    if (!POINT_TYPES[keyOf(def)] || POINT_TYPES[keyOf(def)].custom) POINT_TYPES[keyOf(def)] = specOfDef(def);
  }
}

export const customFruits = () => current.map((d) => ({ ...d, taste: { ...d.taste }, effects: d.effects.map((e) => ({ ...e })), tree: { ...d.tree } }));
export const customKeys = () => current.map(keyOf);

export function saveFruits() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(current)); } catch { /* not kept */ }
}

// Some starting fruit, so a first map has more than nectar to learn about.
// Each teaches something different: a filling one, a juicy one that quenches,
// one that sharpens the senses and a tempting one that makes her sick.
export function starterFruits() {
  return [
    { ...blankFruit('Baya dulce'), color: '#e2c84a', shape: 'round', smell: 'sweet', hunger: -30, taste: { sweet: 0.8 } },
    { ...blankFruit('Gota jugosa'), color: '#4cc9f0', shape: 'drop', smell: 'sour', hunger: -8, thirst: -25, taste: { sour: 0.5, sweet: 0.3 } },
    { ...blankFruit('Orbe amargo'), color: '#b57bff', shape: 'orb', smell: 'musky', hunger: -5, taste: { bitter: 0.4, umami: 0.4 },
      effects: [{ stat: 'viewRange', mult: 1.6, sec: 12 }, { stat: 'smell', mult: 1.5, sec: 12 }] },
    { ...blankFruit('Cristal picante'), color: '#d9504f', shape: 'crystal', smell: 'sharp', hunger: 20, taste: { spicy: 0.7, sweet: 0.3 },
      effects: [{ stat: 'speed', mult: 1.5, sec: 6 }] },
  ].map((d) => ({ ...d, id: newId() }));
}

// At startup: what this browser last used, or the starters the first time.
export function loadFruits() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null'); } catch { saved = null; }
  return registerFruits(Array.isArray(saved) ? saved : starterFruits());
}

// The fruit the game used to have before the person made their own. Sessions
// recorded back then still name them; a replay brings them back only to draw
// and inspect those sessions (addRetired), never to place.
const RETIRED = {
  spark: { color: '#4cc9f0', radius: 5, aroma: 85, life: 240, hunger: -5, effects: [{ stat: 'speed', mult: 1.8, sec: 8 }],
    traits: { color: 'blue', shape: 'crystal', smell: 'sharp' }, taste: { sour: 0.5, spicy: 0.6 }, painter: 'spark' },
  eye: { color: '#b57bff', radius: 5, aroma: 85, life: 240, hunger: -5,
    effects: [{ stat: 'viewRange', mult: 1.6, sec: 10 }, { stat: 'fovDeg', mult: 1.4, sec: 10 }],
    traits: { color: 'purple', shape: 'orb', smell: 'musky' }, taste: { bitter: 0.6 }, painter: 'eye' },
  resin: { color: '#e8a33d', radius: 6, aroma: 145, life: 320, hunger: -10, effects: [{ stat: 'hungerRate', mult: 0.5, sec: 14 }],
    traits: { color: 'orange', shape: 'drop', smell: 'musky' }, taste: { sweet: 0.4, astringent: 0.6 }, painter: 'resin' },
};

export function addRetired(key) {
  if (key && !POINT_TYPES[key] && RETIRED[key]) POINT_TYPES[key] = { ...RETIRED[key], retired: true };
}
