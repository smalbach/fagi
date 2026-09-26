// Catálogo de eventos de una sesión. Lo comparten el navegador (grabador y
// reproductor) y el servidor (validación antes de guardar): sin DOM, sin
// imports del juego.
//
// Todo evento es { seq, t, type, ...datos }. `seq` es su orden dentro de la
// sesión (entero, desde 0) y `t` el reloj del mundo en segundos. `type` es el
// tipo de evento; el tipo del objeto del mundo (agua, arbol, una fruta...) va
// en `what` para no pisarlo.

export const EVENT_VERSION = 1;

// type -> campos obligatorios. Los opcionales no se listan.
export const EVENT_TYPES = {
  session_start: ['config', 'world'],
  session_end: ['reason'],
  obj_add: ['id', 'what', 'x', 'y'],
  obj_remove: ['id'],
  obj_move: ['id', 'x', 'y'],
  obj_resize: ['id', 'r'],
  point_add: ['id', 'what', 'x', 'y'],
  point_rot: ['id', 'what'],
  point_remove: ['id', 'reason'],
  nest_store: ['what'],
  nest_take: ['what'],
  nest_spoil: ['count'],
  phero_drop: ['x', 'y'],
  wind: ['angle', 'target'],
  rain: ['on'],
  config: ['id', 'to'],
  fagi_eat: ['what'],
  fagi_pick: ['what'],
  fagi_drink_start: [],
  fagi_drink_stop: [],
  fagi_deposit: ['what'],
  fagi_pantry: ['what'],
  fagi_rule: ['rule'],
  fagi_death: ['cause'],
  track: ['pts'],
  mind: [],
  log: ['tag', 'text'],
};

// Columnas de cada punto de un bloque `track`, en este orden.
export const TRACK_FIELDS = ['t', 'x', 'y', 'angle', 'action', 'targetId', 'carrying', 'hunger', 'thirst', 'energy',
  'targetKind', 'drinking', 'castSide', 'scentX', 'scentY', 'legX', 'legY', 'leg'];

// Sucesos que merecen una marca en la barra de tiempo del reproductor.
export const MARKER_TYPES = new Set(['fagi_eat', 'fagi_pick', 'fagi_deposit', 'fagi_pantry', 'fagi_rule', 'fagi_death', 'config']);

// Devuelve null si el evento vale, o el motivo si no.
export function invalidEvent(ev) {
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) return 'not_object';
  if (!Number.isInteger(ev.seq) || ev.seq < 0) return 'seq';
  if (typeof ev.t !== 'number' || !Number.isFinite(ev.t) || ev.t < 0) return 't';
  const campos = EVENT_TYPES[ev.type];
  if (!campos) return `type:${String(ev.type).slice(0, 40)}`;
  for (const c of campos) if (ev[c] === undefined) return `${ev.type}.${c}`;
  return null;
}
