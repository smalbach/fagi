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
  obj_appearance: ['id', 'appearance'],
  obj_fruit: ['id', 'what'],   // a tree of a wild species (chemistry.js)
  obj_look: ['id', 'look'],    // how a thing looks (things.js): { color, shape, texture }
  nest_line: ['id', 'look'],   // a thing laid in the nest's lining (things.js)
  point_add: ['id', 'what', 'x', 'y'],
  point_rot: ['id', 'what'],
  point_remove: ['id', 'reason'],
  nest_store: ['what'],
  nest_take: ['what'],
  nest_spoil: ['count'],
  phero_drop: ['x', 'y'],
  wind: ['angle', 'target'],
  rain: ['on'],
  // The time of year (seasons.js): when it turns, and as winter deepens or
  // eases; name 'none' when the seasons are switched off.
  season: ['name', 'year'],
  // A tree's own lifespan and age (trees.js, TREE.seed), when it gets them.
  tree_time: ['id', 'life', 'age'],
  // Mud worn into a trail (movement.js): which patch, and how worn.
  mud_tread: ['i', 'tread'],
  config: ['id', 'to'],
  fagi_eat: ['what'],
  fagi_pick: ['what'],
  fagi_drink_start: [],
  fagi_drink_stop: [],
  fagi_deposit: ['what'],
  fagi_pantry: ['what'],
  fagi_rule: ['rule'],
  fagi_death: ['cause'],
  follow: ['id', 'from'],   // she died; the game follows another of the population from here
  track: ['pts'],
  sisters: ['ants'],   // her sisters (colony.js): [[id, x, y, angle, alive, carrying, stage?], ...]
  mind: [],
  log: ['tag', 'text'],
  // The organism (docs/ESPECIFICACION_ENTE_ADAPTATIVO.md): a new day, and
  // what she sorted out while asleep.
  day: ['day'],
  night_report: ['report'],
  night_mind: ['night', 'entries'],
  // Things and concepts (things.js, concepts.js): a touch or a nibble and what
  // she felt, and a concept formed, tested or retired.
  thing_contact: ['id', 'act', 'felt'],
  concept: ['id', 'change'],
  // Life (reproduction.js): an egg laid, one that hatched, one lost, and the end.
  egg: ['id', 'mother', 'father'],
  hatch: ['id', 'egg'],
  egg_lost: ['id', 'reason'],
  colony_found: ['from', 'to'],   // a party left its nest to found another (reproduction.js)
  extinct: ['at'],
  // Who is who (names.js): id -> { name, mother, father, generation, sex, bornAt },
  // sent once per individual, the first time the recording sees her.
  // Explore or come back (FORAGE, trees.js, patches.js): a seasonal tree goes
  // bare and bears again; a patch of fruit shows up on the ground.
  tree_bare: ['id'],
  tree_bears: ['id'],
  patch: ['x', 'y', 'what', 'n'],
  // Loaded to a full nest (LARDER, larder.js): what she did with her load.
  nest_full: ['what', 'did'],
  people: ['people'],   // what the night mind proposed and what was kept (night/)
  // God mode (godmode.js): a parameter of a Fagi set by hand mid-session.
  god: ['id', 'param', 'from', 'to'],
  // Something on the map set by hand (object-edit.js): a tree, or a fruit (point: 1).
  obj_edit: ['id', 'param', 'from', 'to'],
};

// Columns of each point in a `track` block, in this order.
export const TRACK_FIELDS = ['t', 'x', 'y', 'angle', 'action', 'targetId', 'carrying', 'hunger', 'thirst', 'energy',
  'targetKind', 'drinking', 'castSide', 'scentX', 'scentY', 'legX', 'legY', 'leg',
  'wet', 'swimming', 'probing', 'pressure', 'pressureFalling',
  'temperature', 'thermalStress', 'sleepPressure', 'sex',
  // How she looks: life stage, too cold or hot, what she hauls home, a code just learned.
  'lifeStage', 'thermalFeel', 'hauling', 'learned'];

// Events that deserve a mark on the player's timeline.
export const MARKER_TYPES = new Set(['fagi_eat', 'fagi_pick', 'fagi_deposit', 'fagi_pantry', 'fagi_rule', 'fagi_death', 'config', 'night_report', 'god', 'obj_edit']);

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
