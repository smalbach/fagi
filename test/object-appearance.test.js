import test from 'node:test';
import assert from 'node:assert/strict';
import { APPEARANCES, validAppearance, naturalAppearance } from '../src/object-appearance.js';
import { createWorld, addObject, setObjectAppearance } from '../src/world.js';
import { createRecorder } from '../src/recorder/recorder.js';
import { createReplayState, applyEvent } from '../src/recorder/replay.js';
import { invalidEvent } from '../src/recorder/events.js';

test('appearance selections do not alter an object’s physical properties', () => {
  const world = createWorld();
  const object = addObject(world, 23, 45, 'tree');
  object.fruit = 'nectar';
  const before = { ...object };
  for (const [appearance] of APPEARANCES.tree) {
    assert.equal(setObjectAppearance(world, object, appearance), true);
    const { appearance: _, ...physical } = object;
    assert.deepEqual(physical, before);
  }
  assert.equal(setObjectAppearance(world, object, 'volcanic'), false);
  assert.equal(setObjectAppearance(world, {}, 'palm'), false);
});

test('each object type validates its own variants and auto is repeatable', () => {
  for (const [type, options] of Object.entries(APPEARANCES)) {
    for (const [id] of options) assert.equal(validAppearance(type, id), true);
    assert.equal(validAppearance(type, 'invalid'), false);
    const o = { type };
    assert.equal(naturalAppearance(o, 123), naturalAppearance(o, 123));
    assert.ok(options.some(([id]) => id === naturalAppearance(o, 123)));
  }
});

test('setup, live appearance changes and new object seeds survive recording/replay', () => {
  const world = createWorld();
  const setup = addObject(world, 10, 20, 'water'); setup.seed = 1234;
  setObjectAppearance(world, setup, 'marsh');
  const events = [];
  world.rec = createRecorder(world, { send: (batch) => events.push(...batch) });
  world.rec.start({ config: {} });
  world.time = 2;
  setObjectAppearance(world, setup, 'clear');
  const live = addObject(world, 100, 120, 'rock', 30, 'user');
  setObjectAppearance(world, live, 'slate');
  world.rec.flush();
  const replay = createReplayState();
  for (const event of events) {
    assert.equal(invalidEvent(event), null);
    applyEvent(replay, event);
  }
  assert.equal(replay.world.objects[0].appearance, 'clear');
  assert.equal(replay.world.objects[0].seed, 1234);
  assert.equal(replay.world.objects[1].appearance, 'slate');
  assert.equal(replay.world.objects[1].seed, live.seed);
  applyEvent(replay, { type: 'obj_appearance', id: live.id, appearance: 'palm' });
  assert.equal(replay.world.objects[1].appearance, 'slate');
});
