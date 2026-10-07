import test from 'node:test';
import assert from 'node:assert/strict';

// The schema can be exercised without mounting the form controls.
globalThis.HTMLInputElement = class { get value() { return ''; } };
const { configSnapshot, applyConfig, configIdOf } = await import('../src/settings.js');
delete globalThis.HTMLInputElement;
const { PROGRAM, CAMERA, ATTENTION, SYNAPSE, EXPLAIN, MOVEMENT, HABITS, SLEEP, THERMAL, BACKEND, NIGHTAI } = await import('../src/config.js');

test('regrouped adaptive settings retain their saved-session IDs', () => {
  for (const key of Object.keys(PROGRAM)) {
    assert.equal(configIdOf(PROGRAM, key), `Adaptive program.${key}`);
  }
  const before = configSnapshot();
  try {
    applyConfig({ 'Adaptive program.crisis': 1, 'Adaptive program.shareBudget': 42, 'Adaptive program.watch': 2 });
    assert.equal(PROGRAM.crisis, 1);
    assert.equal(PROGRAM.shareBudget, 42);
    assert.equal(PROGRAM.watch, 2);
  } finally { applyConfig(before); }
});

test('new controls are included in snapshots and accept bounded updates', () => {
  const before = configSnapshot();
  try {
    for (const [obj, key] of [[CAMERA, 'max'], [ATTENTION, 'forget'], [SYNAPSE, 'prune'], [EXPLAIN, 'examples'],
      [MOVEMENT, 'terrainAdapt'], [HABITS, 'learn'], [SLEEP, 'askAlways'], [THERMAL, 'voluntary'], [BACKEND, 'maxTtl'], [NIGHTAI, 'timeout']]) {
      const id = configIdOf(obj, key);
      assert.ok(id, key);
      assert.equal(before[id], obj[key]);
    }
    applyConfig({ 'Camera.max': 999, 'Attention.forget': -2, 'Neural connections.prune': 0.2 });
    assert.equal(CAMERA.max, 8);
    assert.equal(ATTENTION.forget, 0.5);
    assert.equal(SYNAPSE.prune, 0.2);
    applyConfig({ 'Camera.max': NaN, 'Unknown.setting': 3 });
    assert.equal(CAMERA.max, 8);
  } finally { applyConfig(before); }
  assert.deepEqual(configSnapshot(), before);
});

test('existing external API fields keep their original snapshot names', () => {
  for (const key of ['enabled', 'authority', 'minInterval', 'timeout', 'ttl', 'idleAfter']) {
    assert.equal(configIdOf(BACKEND, key), `External decision API.${key}`);
  }
});
