import test from 'node:test';
import assert from 'node:assert/strict';
import { baseClimate, climateKey, airTemp, leafFallOf } from '../src/climate.js';
import { CYCLE, RAIN, SEASONS, MAPGEN, WORLD } from '../src/config.js';
import { createWorld, resetWorld } from '../src/world.js';
import { generateMap } from '../src/mapgen.js';
import { radiusOf } from '../src/obstacles.js';

function withConfig(patches, fn) {
  const saved = patches.map(([obj]) => structuredClone(obj));
  try {
    for (const [obj, values] of patches) Object.assign(obj, values);
    return fn();
  } finally {
    patches.forEach(([obj], i) => Object.assign(obj, saved[i]));
  }
}

test('the default settings keep the temperate ground', () => {
  const c = baseClimate();
  assert.equal(c.arid, 0);
  assert.equal(c.lush, 0);
  assert.equal(c.cold, 0);
});

test('little rain and heat make a dry place; much rain a lush one; a low mean a cold one', () => {
  const desert = withConfig([[CYCLE, { mean: 38 }], [RAIN, { every: { min: 3000, max: 3600 }, duration: { min: 5, max: 10 } }]], baseClimate);
  assert.ok(desert.arid > 0.9, `arid ${desert.arid}`);
  assert.equal(desert.lush, 0);

  const jungle = withConfig([[CYCLE, { mean: 27 }], [RAIN, { every: { min: 60, max: 120 }, duration: { min: 40, max: 80 } }]], baseClimate);
  assert.ok(jungle.lush > 0.8, `lush ${jungle.lush}`);
  assert.equal(jungle.arid, 0);

  const tundra = withConfig([[CYCLE, { mean: -4 }]], baseClimate);
  assert.ok(tundra.cold > 0.8, `cold ${tundra.cold}`);
});

test('the ground is repainted only when the climate visibly changes', () => {
  const before = climateKey();
  assert.equal(withConfig([[CYCLE, { mean: 22.4 }]], () => climateKey()), before);
  assert.notEqual(withConfig([[CYCLE, { mean: 40 }]], () => climateKey()), before);
});

test('the air follows the season even with the day off', () => {
  withConfig([[CYCLE, { enabled: 0, mean: 10 }]], () => {
    assert.equal(airTemp({ time: 0, season: { cold: 8 } }), 2);
    assert.equal(airTemp({ time: 0, season: null }), 10);
  });
});

test('broadleaf trees shed only where winter is cold', () => {
  const deep = { on: true, depth: 1, cold: 8, hot: false };
  withConfig([[CYCLE, { mean: 12 }], [SEASONS, { winterCold: 10 }]], () => {
    assert.ok(leafFallOf(deep) > 0.9);
    assert.equal(leafFallOf({ ...deep, depth: 0 }), 0);
  });
  withConfig([[CYCLE, { mean: 34 }], [SEASONS, { winterCold: 2 }]], () => {
    assert.equal(leafFallOf(deep), 0);   // a tropical winter: evergreen
  });
  assert.equal(leafFallOf(null), 0);
});

test('mud patches stay clear of water, nest, trees, rocks and each other', () => {
  withConfig([[MAPGEN, { hazards: 1, mudPatches: 8 }]], () => {
    for (let k = 0; k < 5; k++) {
      const world = createWorld();
      resetWorld(world);
      generateMap(world);
      assert.ok(world.mud.length > 0);
      for (const m of world.mud) {
        assert.ok(m.x - m.r >= 0 && m.x + m.r <= WORLD.width && m.y - m.r >= 0 && m.y + m.r <= WORLD.height);
        assert.ok(Number.isInteger(m.seed));
        for (const o of world.objects) assert.ok(Math.hypot(o.x - m.x, o.y - m.y) >= radiusOf(o) + m.r * 0.6);
        for (const n of world.mud) if (n !== m) assert.ok(Math.hypot(n.x - m.x, n.y - m.y) >= n.r + m.r);
      }
      // A new map without hazards takes no mud from the last one.
      MAPGEN.hazards = 0;
      resetWorld(world);
      generateMap(world);
      assert.equal(world.mud.length, 0);
      MAPGEN.hazards = 1;
    }
  });
});
