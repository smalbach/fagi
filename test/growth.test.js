import test from 'node:test';
import assert from 'node:assert/strict';
import { GROWTH, LIFE, WORLD, EXPLORE } from '../src/config.js';
import { createWorld, addObject, nestsOf, sizeWorld } from '../src/world.js';
import { growMap, updateGrowth } from '../src/growth.js';
import { createExploreMap } from '../src/explore.js';

function withGrowth(fn) {
  const saved = { ...GROWTH };
  Object.assign(GROWTH, { enabled: 1, every: 0, density: 1e9 });
  try { fn(); } finally { Object.assign(GROWTH, saved); sizeWorld({}, 1); }
}

// A base map with a nest, a pond and trees, as the game's has per nest.
function baseMap() {
  const w = createWorld();
  sizeWorld(w, 1);
  addObject(w, 300, 300, 'nest');
  addObject(w, 450, 300, 'water');
  addObject(w, 300, 650, 'tree');
  addObject(w, 700, 300, 'tree');
  addObject(w, 900, 600, 'rock');
  // Free ground with water and trees of its own, a nest's reach away.
  addObject(w, 820, 420, 'water');
  addObject(w, 1000, 300, 'tree');
  addObject(w, 820, 700, 'tree');
  w.lineage = {};
  return w;
}

const adult = (id, sex, home) => ({ id, sex, home, alive: true, lifeStage: 'adult', pantry: {} });

test('off, nothing grows and no nest is founded', () => {
  const w = baseMap();
  const colony = { ants: [], life: {} };
  updateGrowth(w, colony);
  assert.equal(w.growth, undefined);
  assert.equal(w.width, WORLD.baseWidth);
});

test('the map grows on its right and bottom edges, the new land stocked like the old', () => withGrowth(() => {
  const w = baseMap();
  const fagi = { alive: true, explored: createExploreMap() };
  fagi.explored[0] = 2;
  fagi.explored[3] = 1;
  w.colony = { ants: [fagi] };
  const before = w.objects.map((o) => [o.id, o.x, o.y]);
  const events = [];
  w.rec = { emit: (type, data) => events.push({ type, ...data }) };
  assert.ok(growMap(w));
  assert.equal(w.width, Math.round(WORLD.baseWidth * (1 + GROWTH.step)));
  assert.equal(w.height, Math.round(WORLD.baseHeight * (1 + GROWTH.step)));
  // What was there keeps its place; what is new is all on the new land.
  assert.deepEqual(w.objects.slice(0, before.length).map((o) => [o.id, o.x, o.y]), before);
  const added = w.objects.slice(before.length);
  assert.ok(added.some((o) => o.type === 'tree'));
  for (const o of added) assert.ok(o.x >= WORLD.baseWidth || o.y >= WORLD.baseHeight);
  // Her map of where she has been keeps every cell where it was.
  const cols = Math.ceil(w.width / EXPLORE.cell);
  assert.equal(fagi.explored.length, cols * Math.ceil(w.height / EXPLORE.cell));
  assert.equal(fagi.explored[0], 2);
  assert.equal(fagi.explored[3], 1);
  assert.ok(events.some((e) => e.type === 'map_grow' && e.width === w.width));
}));

test('the map never grows past GROWTH.max', () => withGrowth(() => {
  GROWTH.max = 1.5;
  const w = baseMap();
  assert.ok(growMap(w));
  assert.equal(growMap(w), false);
}));

test('a full nest sends a party out to found a new one, with no cap on the whole', () => withGrowth(() => {
  const w = baseMap();
  const nest = nestsOf(w)[0];
  const ants = [];
  for (let i = 1; i <= Math.ceil(GROWTH.budAt * LIFE.maxPopulation); i++) ants.push(adult(i, i % 2 ? 'female' : 'male', nest.id));
  const colony = { ants, life: {} };
  updateGrowth(w, colony);
  const nests = nestsOf(w);
  assert.equal(nests.length, 2);
  const moved = ants.filter((f) => f.home === nests[1].id);
  assert.equal(moved.length, GROWTH.party);
  assert.ok(moved.some((f) => f.sex === 'female') && moved.some((f) => f.sex === 'male'));
  assert.equal(w.growth.buds, 1);
}));

test('a replay grows the map where the recording did', async () => {
  const { createReplayState, applyEvent } = await import('../src/recorder/replay.js');
  const state = createReplayState();
  applyEvent(state, { seq: 0, t: 10, type: 'map_grow', width: 1920, height: 1290 });
  assert.deepEqual([state.world.width, state.world.height], [1920, 1290]);
});

test('a nest left with only kin gets an unrelated male from its neighbour', () => withGrowth(() => {
  const w = baseMap();
  const a = nestsOf(w)[0];
  const b = addObject(w, 900, 300, 'nest');
  const ants = [adult(1, 'female', a.id), adult(2, 'male', a.id), adult(3, 'male', b.id), adult(4, 'male', b.id), adult(5, 'female', b.id)];
  const founder = { mother: null, father: null, bornAt: 0 };
  w.lineage = { 10: founder, 11: founder, 1: { mother: 10, father: 11, bornAt: 5 }, 2: { mother: 10, father: 11, bornAt: 6 } };   // 1 and 2: siblings
  const colony = { ants, life: {} };
  updateGrowth(w, colony);
  assert.equal(ants.filter((f) => f.home === a.id && f.sex === 'male').length, 2);
  assert.equal(w.growth.moved, 1);
}));

test('the dead leave the colony once counted', () => withGrowth(() => {
  const w = baseMap();
  const nest = nestsOf(w)[0];
  const ants = [adult(1, 'female', nest.id), { ...adult(2, 'male', nest.id), alive: false, counted: true }, { ...adult(3, 'male', nest.id), alive: false }];
  const colony = { ants, life: {} };
  updateGrowth(w, colony);
  assert.deepEqual(colony.ants.map((f) => f.id), [1, 3]);
}));
