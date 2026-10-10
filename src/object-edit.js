// Editing what is on the map: pick a tree, a nest, a pond, a rock or a fruit
// in the inspector and set its numbers by hand (object-edit-panel.js).
//
// What can be touched, per kind:
//   tree    the fruit it bears, how often, how much it leaves lying, its size,
//           and (when trees age, TREE.life) its age and lifespan
//   fruit   how old it is (ripe, about to rot, rotten)
//   other   its size
//
// As with god mode (godmode.js), an edit never bypasses the simulation: a
// tree set past its lifespan dies on the next frame. Every edit is recorded
// ('obj_edit', or the map's own events for size and fruit) and, in a running
// session, marks it as touched by hand (world.god).

import { TREE, POINT_TYPES, OBJECT_TYPES } from './config.js';
import { record } from './world.js';
import { intervalOf, maxNearOf, lifeOf } from './trees.js';
import { radiusOf } from './obstacles.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const kindOf = (o) => (o.type in POINT_TYPES ? 'point' : OBJECT_TYPES[o.type]?.kind);

// Its size; a young tree set by hand is grown (trees.js grow).
const SIZE = {
  id: 'r', label: ['Size (radius px)', 'Tamaño (radio px)'], min: 10, max: 140, step: 1,
  get: (o) => radiusOf(o),
  set: (w, o, v) => { delete o.full; o.r = v; record(w, 'obj_resize', { id: o.id, r: v }); },
};

const TREE_PARAMS = [
  { id: 'fruit', label: ['Fruit it bears', 'Fruto que da'], options: () => Object.keys(POINT_TYPES),
    get: (o) => o.fruit ?? TREE.fruit,
    set: (w, o, v) => { o.fruit = v; record(w, 'obj_fruit', { id: o.id, what: v }); } },
  { id: 'interval', label: ['One fruit every (s)', 'Un fruto cada (s)'], min: 1, max: 240, step: 1,
    get: (o) => intervalOf(o), set: (w, o, v) => { o.interval = v; o.timer = Math.min(o.timer ?? v, v); } },
  { id: 'timer', label: ['Next fruit in (s)', 'Próximo fruto en (s)'], min: 0, max: (o) => intervalOf(o), step: 1,
    get: (o) => Math.max(0, o.timer ?? 0), set: (w, o, v) => { o.timer = v; } },
  { id: 'maxNear', label: ['Fruit left lying before it stops', 'Fruta en el suelo antes de parar'], min: 1, max: 30, step: 1,
    get: (o) => maxNearOf(o), set: (w, o, v) => { o.maxNear = v; } },
  SIZE,
  { id: 'age', label: ['Age (s)', 'Edad (s)'], min: 0, max: (o) => Math.max(60, Math.round(lifeOf(o))), step: 10,
    on: () => TREE.life > 0, get: (o) => o.age ?? 0, set: (w, o, v) => { o.age = v; } },
  { id: 'life', label: ['Lifespan (s)', 'Vida total (s)'], min: 60, max: 14400, step: 60,
    on: () => TREE.life > 0, get: (o) => Math.round(lifeOf(o)), set: (w, o, v) => { o.life = v; } },
];

const POINT_PARAMS = [
  { id: 'age', label: ['Age (s)', 'Edad (s)'], min: 0, max: (p) => Math.max(1, POINT_TYPES[p.type]?.life ?? 0), step: 1,
    on: (p) => (POINT_TYPES[p.type]?.life ?? 0) > 0, get: (p) => p.age ?? 0, set: (w, p, v) => { p.age = v; } },
];

function paramsOf(o) {
  const kind = kindOf(o);
  if (kind === 'spawner') return TREE_PARAMS;
  if (kind === 'point') return POINT_PARAMS;
  return [SIZE];
}

const valueOf = (x, o) => (typeof x === 'function' ? x(o) : x);

// The parameters that mean something now, with their range for this one.
export function editParams(o) {
  return paramsOf(o).filter((p) => !p.on || p.on(o)).map((p) => ({
    ...p, min: valueOf(p.min, o), max: valueOf(p.max, o), options: p.options?.(), value: p.get(o),
  }));
}

export const editParamOf = (o, id) => paramsOf(o).find((p) => p.id === id) ?? null;

// Sets one parameter (clamped, or one of its options). Returns { from, to },
// or null if nothing could be set.
export function editSet(world, o, id, value) {
  const p = editParamOf(o, id);
  if (!p || (p.on && !p.on(o))) return null;
  const from = p.get(o);
  let to = value;
  if (p.options) { if (!p.options().includes(to)) return null; }
  else {
    if (!Number.isFinite(to)) return null;
    to = clamp(to, valueOf(p.min, o), valueOf(p.max, o));
    if (p.step >= 1) to = Math.round(to);
  }
  p.set(world, o, to);
  return { from, to };
}

// Records a finished edit; in a running session, marks it as touched by hand.
export function noteEdit(world, o, param, from, to, { mark = true } = {}) {
  if (!world || from === to) return;
  if (mark) world.god = (world.god ?? 0) + 1;
  record(world, 'obj_edit', { id: o.id, point: kindOf(o) === 'point' ? 1 : 0, param, from, to });
}
