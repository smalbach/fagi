// Catalog of a session's events. Shared by the browser (recorder and player)
// and the server (validation before saving): no DOM, no game imports.
//
// Every event is { seq, t, type, ...data }. `seq` is its order within the
// session (integer, from 0) and `t` the world clock in seconds. `type` is the
// event type; the world object's type (water, tree, a fruit...) goes in
// `what` so it doesn't clash.

export const EVENT_VERSION = 1;

// type -> required fields. Optional ones are not listed.
export const EVENT_TYPES = {
  session_start: ['config', 'world'],
  session_end: ['reason'],
  obj_add: ['id', 'what', 'x', 'y'],
  obj_remove: ['id'],
  obj_move: ['id', 'x', 'y'],
  obj_resize: ['id', 'r'],
  obj_fruit: ['id', 'what'],   // a tree of a wild species (chemistry.js)
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
  sisters: ['ants'],   // her sisters (colony.js): [[id, x, y, angle, alive, carrying], ...]
  mind: [],
  log: ['tag', 'text'],
};

// Columns of each point in a `track` block, in this order.
export const TRACK_FIELDS = ['t', 'x', 'y', 'angle', 'action', 'targetId', 'carrying', 'hunger', 'thirst', 'energy',
  'targetKind', 'drinking', 'castSide', 'scentX', 'scentY', 'legX', 'legY', 'leg',
  'wet', 'swimming', 'probing', 'pressure', 'pressureFalling'];

// Events that deserve a mark on the player's timeline.
export const MARKER_TYPES = new Set(['fagi_eat', 'fagi_pick', 'fagi_deposit', 'fagi_pantry', 'fagi_rule', 'fagi_death', 'config']);

// Returns null if the event is valid, or the reason if not.
export function invalidEvent(ev) {
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) return 'not_object';
  if (!Number.isInteger(ev.seq) || ev.seq < 0) return 'seq';
  if (typeof ev.t !== 'number' || !Number.isFinite(ev.t) || ev.t < 0) return 't';
  const fieldsOf = EVENT_TYPES[ev.type];
  if (!fieldsOf) return `type:${String(ev.type).slice(0, 40)}`;
  for (const c of fieldsOf) if (ev[c] === undefined) return `${ev.type}.${c}`;
  return null;
}
